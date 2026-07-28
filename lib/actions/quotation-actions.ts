/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
import { supabase } from "@/lib/supabase";

export async function acceptQuotationAndCreateInvoice(quotationId: string, currentUserId: string) {
  // 1. Fetch Quotation
  const { data: quotation, error: qErr } = await supabase.from("quotations").select("*").eq("id", quotationId).single();
  if (qErr || !quotation) throw new Error("Failed to load quotation");
  if (quotation.status === 'accepted') throw new Error("Quotation is already accepted");

  // 2. Generate Description from Items
  const items = quotation.items as any[];
  const desc = items && items.length > 0 
    ? items.map((i: any) => i.description).join(" + ")
    : "General Print Order";
  
  const category = items && items.length > 0 && items[0].category !== "General" ? items[0].category : "Other";
  const qty = items ? items.reduce((acc: number, i: any) => acc + Number(i.qty || 1), 0) : 1;

  // 3. Create Invoice
  const { data: invoice, error: iErr } = await supabase.from("invoices").insert({
    customer_name: quotation.customer_name,
    customer_phone: quotation.customer_phone,
    customer_email: quotation.customer_email,
    description: desc,
    category: category,
    qty: qty,
    bill_value: quotation.total_amount,
    advance_paid: 0,
    balance_due: quotation.total_amount,
    payment_status: "pending",
    delivery_date: quotation.valid_until,
    pipeline_stage: "RAW_MATERIALS",
    status: "active",
    quotation_id: quotation.id,
    created_by: currentUserId
  }).select().single();

  if (iErr || !invoice) throw new Error("Failed to create invoice: " + iErr?.message);

  // 4. Update Quotation
  await supabase.from("quotations").update({ status: 'accepted', invoice_id: invoice.id }).eq('id', quotation.id);

  // 5. Create WIP Card  
  await supabase.from("wip_cards").insert({
    invoice_id: invoice.id,
    stage: "RAW_MATERIALS",   // correct column name is 'stage' not 'phase'
    from_quotation: true
  });

  // 6. Create Final Check Protocol (initialized blank)
  await supabase.from("final_check_protocols").insert({
    invoice_id: invoice.id,
    checks: {} // The DB defaults handles the JSON check map or we can define it later
  });

  return invoice;
}

export async function rejectQuotation(quotationId: string) {
  const { error } = await supabase.from("quotations").update({ status: 'rejected' }).eq("id", quotationId);
  if (error) throw new Error("Failed to reject quotation");
  return true;
}

