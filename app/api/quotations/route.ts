/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { quotationSchema } from "@/lib/validations";

import { mapQuotationToSnakeCase } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const where: any = { deletedAt: null };
    if (session.user.role !== "ADMIN") {
      where.createdBy = session.user.id;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const cursor = searchParams.get("cursor");
    const direction = searchParams.get("direction") || "next";

    const queryOpts: any = {
      where,
      orderBy: { createdAt: "desc" },
      take: direction === "prev" ? -limit : limit,
      select: {
        id: true,
        quotationNumber: true,
        customerName: true,
        totalAmount: true,
        items: true,
        validUntil: true,
        status: true,
        invoiceId: true,
        createdAt: true,
      }
    };

    if (cursor) {
      queryOpts.cursor = { id: cursor };
      queryOpts.skip = 1;
    } else {
      const skipAmount = (page - 1) * limit;
      if (skipAmount > 0) queryOpts.skip = skipAmount;
    }

    const [data, total] = await Promise.all([
      prisma.quotation.findMany(queryOpts),
      prisma.quotation.count({ where })
    ]);
    
    return NextResponse.json(
      { success: true, data: data.map(mapQuotationToSnakeCase), metadata: { total, page, limit, totalPages: Math.ceil(total / limit) } },
      { headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" } }
    );
  } catch (error: any) {
    console.error("Failed to fetch quotations API:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = quotationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const payload = parsed.data;

    let nextNum = 1000;
    const latest = await prisma.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true }
    });

    if (latest && latest.quotationNumber) {
      const match = latest.quotationNumber.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const generatedQuotationNumber = `QUO-${nextNum}`;

    const data = await prisma.quotation.create({
      data: {
        ...payload,
        quotationNumber: generatedQuotationNumber,
        createdBy: session.user.id,
      },
      include: { creator: true }
    });

    return NextResponse.json({ success: true, data: mapQuotationToSnakeCase(data) });
  } catch (error: any) {
    console.error("Failed to save quotation API:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save quotation" },
      { status: 500 }
    );
  }
}

