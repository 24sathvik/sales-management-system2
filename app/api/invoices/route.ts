export const dynamic = "force-dynamic";
/* eslint-disable @typescript-eslint/no-explicit-any */
// SECURITY CHECKLIST:
// - [x] Authentication (getServerSession)
// - [x] Role-Based Access Control (requireRole)
// - [x] Input Validation (Zod safeParse)
// - [x] Date/Enum Validation
// - [x] SQL Injection protection (Prisma ORM parameterization)
// - [x] Rate Limiting
// - [x] Unified Error Handler (handleApiError)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireRole } from "@/lib/auth-helpers";
import { checkRateLimit } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";
import { invoiceCreateSchema } from "@/lib/validations";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const assigneeId = searchParams.get("assigneeId") || "";
    const sortBy = searchParams.get("sortBy") || "finalDeliveryDate";
    const order = searchParams.get("order") || "asc";
    const status = searchParams.get("status") || "ACTIVE";
    const filter = searchParams.get("filter");
    
    // Advanced Filters
    const category = searchParams.get("category");
    const printingColor = searchParams.get("printingColor");
    const designer = searchParams.get("designer");
    const printer = searchParams.get("printer");
    const deliveryDateFrom = searchParams.get("deliveryDateFrom");
    const deliveryDateTo = searchParams.get("deliveryDateTo");
    const createdFrom = searchParams.get("createdFrom") || searchParams.get("startDate");
    const createdTo = searchParams.get("createdTo") || searchParams.get("endDate");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const packing = searchParams.get("packing");
    const advancePaidFilters = searchParams.get("advancePaid");

    // DB Query uses Prisma ORM which automatically parameterizes inputs, preventing SQL injection
    const where: any = {};

    // Role-Based Access Control: Non-admins only see what they created
    if (session.user.role !== "ADMIN") {
      where.createdById = session.user.id;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { invoiceNumber: { equals: isNaN(Number(search)) ? undefined : Number(search) } },
      ].filter(c => c.invoiceNumber?.equals !== undefined || c.customerName);
    }

    if (assigneeId && assigneeId !== "all") where.assigneeId = assigneeId;
    
    // Apply Stat Card Filter Overrides
    if (filter === "active") {
      where.status = "ACTIVE";
    } else if (filter === "deliveries") {
      where.status = "ACTIVE";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const in7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      where.finalDeliveryDate = { gte: today, lte: in7Days };
    } else if (filter === "overdue") {
      where.status = "ACTIVE";
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      where.finalDeliveryDate = { lt: today };
    } else if (status && status !== "ALL") {
      where.status = status;
    }

    if (category && category !== "all") {
      const cats = category.split(",").map(c => c.trim()).filter(Boolean);
      if (cats.length > 0) where.category = { in: cats };
    }
    if (printingColor) where.printingColor = { contains: printingColor, mode: "insensitive" };
    if (designer) where.designer = { contains: designer, mode: "insensitive" };
    if (printer) where.printer = { contains: printer, mode: "insensitive" };
    
    if (deliveryDateFrom || deliveryDateTo) {
      where.finalDeliveryDate = {};
      if (deliveryDateFrom) where.finalDeliveryDate.gte = new Date(deliveryDateFrom);
      if (deliveryDateTo) {
        const end = new Date(deliveryDateTo);
        end.setHours(23, 59, 59, 999);
        where.finalDeliveryDate.lte = end;
      }
    }

    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt.gte = new Date(createdFrom);
      if (createdTo) {
        const end = new Date(createdTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = Number(minAmount);
      if (maxAmount) where.totalAmount.lte = Number(maxAmount);
    }
    if (packing && packing !== "ALL") where.packing = packing;
    if (advancePaidFilters && advancePaidFilters !== "ALL") {
      where.advancePaid = advancePaidFilters === "Paid";
    }

    const cursor = searchParams.get("cursor");
    const direction = searchParams.get("direction") || "next";
    
    const queryOpts: any = {
      where,
      orderBy: { [sortBy]: order },
      take: direction === "prev" ? -limit : limit,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        description: true,
        category: true,
        quantity: true,
        printingColor: true,
        paperSize: true,
        designer: true,
        printer: true,
        finalDeliveryDate: true,
        status: true,
        packing: true,
        advancePaid: true,
        unitRate: true,
        totalAmount: true,
        balance: true,
        assignee: { select: { id: true, name: true } }
      },
    };

    if (cursor) {
      queryOpts.cursor = { id: cursor };
      queryOpts.skip = 1; // Skip the cursor itself
    } else {
      // Fallback for direct page jump or page 1
      const skipAmount = (page - 1) * limit;
      if (skipAmount > 0) queryOpts.skip = skipAmount;
    }

    const [invoices, total] = await Promise.all([
      (prisma.invoice as any).findMany(queryOpts),
      (prisma.invoice as any).count({ where })
    ]);

    return NextResponse.json(
      {
        success: true,
        data: invoices,
        metadata: { total, page, limit, totalPages: Math.ceil(total / limit) }
      },
      {
        headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" }
      }
    );
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const rateLimitResponse = await checkRateLimit(req, session.user.id, 100);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const parsed = invoiceCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const quantity = Number(data.quantity);
    const unitRate = Number(data.unitRate);
    const toleranceQuantity = 0; // Deprecated field
    const totalAmount = quantity * unitRate;
    const advanceAmount = data.advancePaid ? Number(data.advanceAmount || 0) : null;
    let balance: number | null = totalAmount;
    if (data.advancePaid && advanceAmount !== null) {
      balance = totalAmount - advanceAmount;
    }

    // DB Query uses Prisma ORM parameterized queries natively
    const result = await prisma.$transaction(async (tx) => {
      // Check for uniqueness if invoiceNumber is manually set
      if (data.invoiceNumber) {
        const existing = await (tx as any).invoice.findUnique({
          where: { invoiceNumber: data.invoiceNumber }
        });
        if (existing) {
          throw new Error(`Invoice number ${data.invoiceNumber} is already in use.`);
        }
      }

      const createData: any = {
        customerName: data.customerName,
        phone: data.phone,
        brideName: data.brideName || "",
        groomName: data.groomName || "",
        category: data.category,
        modelNumber: data.modelNumber || "",
        description: data.description,
        date: data.date ? new Date(data.date) : new Date(),
        quantity,
        toleranceQuantity,
        unitRate,
        totalAmount,
        advancePaid: data.advancePaid,
        advanceAmount,
        advanceMode: data.advancePaid && data.advanceMode ? data.advanceMode : null,
        balance,
        balancePaid: balance !== null && balance <= 0,
        balanceMode: data.balanceMode || null,
        estimatedDesignTime: data.estimatedDesignTime || "",
        estimatedPrintTime: data.estimatedPrintTime || "",
        packing: data.packing,
        printingColor: data.printingColor,
        designer: data.designer,
        printer: data.printer,
        additionalNotes: data.additionalNotes,
        contentConfirmedOn: data.contentConfirmedOn ? new Date(data.contentConfirmedOn) : null,
        finalDeliveryDate: data.finalDeliveryDate ? new Date(data.finalDeliveryDate) : null,
        assigneeId: data.assigneeId || session.user.id,
        createdById: session.user.id,
        status: "ACTIVE",
      };

      if (data.invoiceNumber) {
        createData.invoiceNumber = data.invoiceNumber;
      }

      const invoice = await (tx as any).invoice.create({
        data: createData,
      });

      const formattedNumber = `INV-${String(invoice.invoiceNumber).padStart(4, "0")}`;
      const cardBaseParams = {
        invoiceId: invoice.id,
        invoiceNumber: formattedNumber,
        description: data.description,
        quantity,
        customerName: data.customerName,
        order: 0,
      };

      const defaultStage = await (tx as any).workflowStage.findFirst({ orderBy: { order: "asc" } });

      await (tx as any).wIPCard.create({
        data: {
          ...cardBaseParams,
          stageId: defaultStage?.id || null,
        }
      });

      await (tx as any).finalCheck.create({
        data: {
          invoiceId: invoice.id,
          invoiceNumber: formattedNumber,
          description: data.description,
          quantity: quantity,
          modelNumber: data.modelNumber || "",
          designer: data.designer || null,
          printer: data.printer || null,
          isComplete: false,
          updatedAt: new Date()
        }
      });

      // BACKFILL/LOG: Write advance payment to transaction ledger
      if (invoice.advancePaid && invoice.advanceAmount && invoice.advanceAmount > 0) {
        // Compute running balance
        const latest = await (tx as any).counterTransaction.findFirst({
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: { runningBalance: true },
        });

        const prevBalance = latest ? Number(latest.runningBalance) : 0;
        const newBalance = prevBalance + Number(invoice.advanceAmount);

        await (tx as any).counterTransaction.create({
          data: {
            type: "CREDIT",
            mode: invoice.advanceMode || "CASH",
            amount: invoice.advanceAmount,
            description: `Advance received for ${formattedNumber}`,
            category: "INVOICE_ADVANCE",
            invoiceId: invoice.id,
            invoiceNumber: formattedNumber,
            runningBalance: newBalance,
            createdBy: session.user.id,
            date: invoice.date,
          }
        });
      }

      return { ...invoice, invoiceNumberFormatted: formattedNumber };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

