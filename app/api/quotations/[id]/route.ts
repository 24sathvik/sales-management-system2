import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { quotationSchema } from "@/lib/validations";

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
    created_by_obj: q.creator ? { id: q.creator.id, full_name: q.creator.name, email: q.creator.email } : null,
  };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const data = await prisma.quotation.findUnique({
      where: { id },
      include: { creator: true }
    });
    
    if (!data) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }
    
    // Also simulate created_by object to match Supabase created_by(*)
    const mappedData = mapQuotationToSnakeCase(data);
    mappedData.created_by = mappedData.created_by_obj; 
    
    return NextResponse.json({ success: true, data: mappedData });
  } catch (error: any) {
    console.error("Failed to fetch quotation ID API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    
    const existing = await prisma.quotation.findUnique({
      where: { id },
      select: { createdBy: true }
    });
      
    if (!existing) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }
    
    if (session.user.role !== "ADMIN" && existing.createdBy !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const payload: any = parsed.data;

    // Do not override ID
    const data = await prisma.quotation.update({
      where: { id },
      data: payload,
      include: { creator: true }
    });
    
    return NextResponse.json({ success: true, data: mapQuotationToSnakeCase(data) });
  } catch (error: any) {
    console.error("Failed to update quotation:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.quotation.findUnique({
      where: { id },
      select: { createdBy: true }
    });
      
    if (!existing) {
      return NextResponse.json({ success: false, error: "Quotation not found" }, { status: 404 });
    }
    
    if (session.user.role !== "ADMIN" && existing.createdBy !== session.user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    
    return NextResponse.json({ success: true, message: "Quotation deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete quotation:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
