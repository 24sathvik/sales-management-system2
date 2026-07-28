import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditInvoicePage({ params }: { params: { id: string } }) {
  await requireAuth();

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
  });

  if (!invoice) return notFound();

  // Format dates strictly for the HTML date inputs (YYYY-MM-DD)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialData: any = {
    ...invoice,
    date: invoice.date ? invoice.date.toISOString().slice(0, 10) : "",
    contentConfirmedOn: invoice.contentConfirmedOn ? invoice.contentConfirmedOn.toISOString().slice(0, 10) : "",
    finalDeliveryDate: invoice.finalDeliveryDate ? invoice.finalDeliveryDate.toISOString().slice(0, 10) : "",
    advanceAmount: invoice.advanceAmount ? Number(invoice.advanceAmount) : undefined,
    balance: invoice.balance ? Number(invoice.balance) : undefined,
    unitRate: Number(invoice.unitRate),
    totalAmount: Number(invoice.totalAmount),
  };

  return (
    <div className="space-y-6">
      <InvoiceForm initialData={initialData} invoiceId={params.id} />
    </div>
  );
}
