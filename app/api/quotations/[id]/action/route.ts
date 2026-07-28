import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function mapQuotationToSnakeCase(q: any) {
  if (!q) return q;
  return {
    ...q,
    quotation_number: q.quotationNumber,
    customer_name: q.customerName,
    customer_email: q.customerEmail,
    customer_phone: q.customerPhone,
    customer_address: q.customerAddress,
    subtotal: q.subtotal,
    discount_percent: q.discountPercent,
    discount_amount: q.discountAmount,
    gst_percent: q.gstPercent,
    tax_amount: q.taxAmount,
    total_amount: q.totalAmount,
    created_at: q.createdAt,
    updated_at: q.updatedAt,
    deleted_at: q.deletedAt,
    created_by: q.createdBy,
    invoice_id: q.invoiceId,
    company_name: q.companyName,
    job_title: q.jobTitle,
    printing_color: q.printingColor,
    paper_size: q.paperSize,
    paper_type: q.paperType,
    finish_type: q.finishType,
    printing_sides: q.printingSides,
    delivery_date: q.deliveryDate,
    advance_required: q.advanceRequired,
    payment_terms: q.paymentTerms,
    custom_payment_terms: q.customPaymentTerms,
  };
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await req.json();
    const { id } = params;

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
    }

    if (action === 'reject') {
      const data = await prisma.quotation.update({
        where: { id },
        data: { status: 'rejected' }
      });
      return NextResponse.json({ 
        success: true, 
        data: mapQuotationToSnakeCase(data), 
        message: "Quotation rejected successfully." 
      });
    }

    // --- ACCEPT WORKFLOW ---
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Idempotency guard: Re-read quotation inside the transaction lock
      const quotation = await tx.quotation.findUnique({
        where: { id }
      });

      if (!quotation) {
        throw new Error("Quotation not found");
      }
      if (quotation.status === 'accepted' || quotation.invoiceId) {
        throw new Error("ALREADY_PROCESSED");
      }

      // 2. Parse Items for combined description
      let itemsArray: any[] = [];
      if (typeof quotation.items === 'string') {
        try { itemsArray = JSON.parse(quotation.items); } catch(e){}
      } else if (Array.isArray(quotation.items)) {
        itemsArray = quotation.items;
      }
      
      const consolidatedDescription = itemsArray.map((i: any) => `${i.qty}x ${i.description}`).join(' | ') || "Quotation Approved Job";

      // 3. Initiate Transaction identically to Native Invoice Generations

      // Calculate total quantity from items — must be an Int for Prisma
      const totalQtyRaw = itemsArray.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0);
      const totalQty = Math.round(totalQtyRaw > 0 ? totalQtyRaw : 1);
      const toleranceQty = 0; // Deprecated field

      const advanceRequiredNum = Number(quotation.advanceRequired || 0);
      const totalAmountNum = Number(quotation.totalAmount || 0);
      
      const advancePaid = advanceRequiredNum > 0;
      const advanceAmount = advancePaid ? advanceRequiredNum : null;
      const balance = totalAmountNum - (advanceAmount || 0);
      const unitRate = totalQty > 0 ? totalAmountNum / totalQty : totalAmountNum;

      // Map quotation items to the invoice PDF format
      const invoiceItems = itemsArray.map((i: any) => ({
        id: String(Math.random()),
        description: i.description || "",
        hsn: i.hsn || "",
        qty: Number(i.qty) || 1,
        rate: Number(i.unit_price) || 0,
        uom: i.uom || "1 Nos",
      }));

      // Build additionalNotes as JSON payload consumed by the invoice PDF generator
      const complexData = {
        customerAddress: quotation.customerAddress || "",
        deliveryNote: "",
        paymentTerms: "100% Advance Payment",
        buyersOrderNo: "",
        despatchDocNo: "",
        despatchDated: "",
        despatchedThrough: "",
        destination: "",
        termsOfDelivery: "",
        gstPercent: Number(quotation.gstPercent) || 5,
        discountType: quotation.discountType || (Number(quotation.discountPercent) > 0 ? "PERCENTAGE" : "FLAT"),
        discountValue: Number(quotation.discountPercent) > 0 ? Number(quotation.discountPercent) : Number(quotation.discountAmount),
        items: invoiceItems,
      };

      // Build Base Payload for Prisma
      const createData = {
        customerName: quotation.customerName,
        phone: quotation.customerPhone || "00000",
        brideName: "",
        groomName: "",
        category: quotation.category || "General",
        modelNumber: quotation.quotationNumber || "",
        description: quotation.jobTitle || consolidatedDescription,
        date: new Date(),
        quantity: totalQty,
        toleranceQuantity: toleranceQty,
        unitRate: unitRate,
        totalAmount: totalAmountNum,
        advancePaid: advancePaid,
        advanceAmount: advanceAmount,
        advanceMode: advancePaid ? "CASH" : null,
        balance: balance,
        balancePaid: balance <= 0,
        balanceMode: null,
        estimatedDesignTime: "TBD",
        estimatedPrintTime: "TBD",
        packing: "WITHOUT_PACKING",
        printingColor: quotation.printingColor || null,
        finalDeliveryDate: quotation.deliveryDate ? new Date(quotation.deliveryDate) : null,
        assigneeId: session.user.id,
        createdById: session.user.id,
        status: "ACTIVE",
        additionalNotes: JSON.stringify(complexData),
      };

      // Construct native Invoice object
      const invoice = await tx.invoice.create({ data: createData });
      const formattedNumber = `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`;

      const cardBaseParams = {
        invoiceId: invoice.id,
        invoiceNumber: formattedNumber,
        description: consolidatedDescription,
        quantity: 1,
        customerName: quotation.customerName,
        order: 0,
      };

      const defaultStage = await tx.workflowStage.findFirst({ orderBy: { order: "asc" } });

      await tx.wIPCard.create({
        data: {
          ...cardBaseParams,
          stageId: defaultStage?.id || null,
        }
      });

      await tx.finalCheck.create({
        data: {
          invoiceId: invoice.id,
          invoiceNumber: formattedNumber,
          description: consolidatedDescription,
          quantity: totalQty,
          modelNumber: quotation.quotationNumber || "",
          designer: null,
          printer: null,
          isComplete: false
        }
      });

      // Update Quotation Status and link Invoice ID
      const updatedQuotation = await tx.quotation.update({
        where: { id },
        data: { 
          status: 'accepted',
          invoiceId: invoice.id
        }
      });

      return { invoice, updatedQuotation };
    });

    return NextResponse.json({ 
      success: true, 
      data: mapQuotationToSnakeCase(result.updatedQuotation), 
      message: "Quotation accepted & Invoice generated!" 
    });

  } catch (error: any) {
    console.error("Quotation Action Error:", error);
    if (error.message === "ALREADY_PROCESSED") {
      return NextResponse.json(
        { success: false, error: "Quotation is already invoiced." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process quotation action" },
      { status: 500 }
    );
  }
}
