import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import QuotationsClient from "./QuotationsClient";
import { mapQuotationToSnakeCase } from "@/lib/utils";

export default async function QuotationsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const where: any = { deletedAt: null };
  if (session.user.role !== "ADMIN") {
    where.createdBy = session.user.id;
  }

  const [data, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
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
    }),
    prisma.quotation.count({ where })
  ]);

  const initialQuotations = {
    data: data.map(mapQuotationToSnakeCase),
    metadata: { total, page: 1, limit: 20, totalPages: Math.ceil(total / 20) }
  };

  return <QuotationsClient initialQuotations={initialQuotations} />;
}
