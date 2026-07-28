import { requireAuth } from "@/lib/auth-utils";
import { InvoiceTable } from "@/components/invoices/InvoiceTable";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function InvoicesPage() {
  const user = await requireAuth();

  const where = user.role !== "ADMIN" ? { createdById: user.id, status: "ACTIVE" as any } : { status: "ACTIVE" as any };
  
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { finalDeliveryDate: "asc" },
      skip: 0,
      take: 20,
      include: { assignee: { select: { id: true, name: true, email: true } } }
    }),
    prisma.invoice.count({ where })
  ]);

  const initialData = {
    data: invoices,
    total,
    page: 1,
    limit: 20,
    totalPages: Math.ceil(total / 20)
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold font-syne tracking-tight text-brand-forest">Invoices</h1>
        <Link 
          href="/dashboard/invoices/new" 
          className="btn btn-cta shadow-md transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Link>
      </div>
      
      <InvoiceTable currentUserRole={user.role} initialData={initialData} />
    </div>
  );
}
