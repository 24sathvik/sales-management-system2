const fs = require('fs');

const quotationSchema = `
enum QuotationStatus {
  draft
  sent
  accepted
  rejected

  @@map("quotation_status")
}

model Quotation {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  quotationNumber     String    @unique @map("quotation_number")
  customerName        String    @map("customer_name")
  customerEmail       String?   @map("customer_email")
  customerPhone       String?   @map("customer_phone")
  customerAddress     String?   @map("customer_address")
  items               Json      @default("[]")
  subtotal            Decimal   @default(0) @db.Decimal(12, 2)
  discountPercent     Decimal?  @default(0) @db.Decimal(5, 2) @map("discount_percent")
  discountAmount      Decimal?  @default(0) @db.Decimal(12, 2) @map("discount_amount")
  taxPercent          Decimal?  @default(0) @db.Decimal(5, 2) @map("tax_percent")
  taxAmount           Decimal?  @default(0) @db.Decimal(12, 2) @map("tax_amount")
  totalAmount         Decimal   @default(0) @db.Decimal(12, 2) @map("total_amount")
  notes               String?
  validUntil          DateTime? @db.Date @map("valid_until")
  status              QuotationStatus @default(draft)

  createdBy           String?   @map("created_by") @db.Uuid
  invoiceId           String?   @map("invoice_id") @db.Uuid

  createdAt           DateTime? @default(now()) @db.Timestamptz() @map("created_at")
  updatedAt           DateTime? @default(now()) @updatedAt @db.Timestamptz() @map("updated_at")
  deletedAt           DateTime? @db.Timestamptz() @map("deleted_at")

  companyName         String?   @map("company_name")
  jobTitle            String?   @map("job_title")
  category            String?
  printingColor       String?   @map("printing_color")
  paperSize           String?   @map("paper_size")
  paperType           String?   @map("paper_type")
  finishType          String?   @map("finish_type")
  printingSides       String?   @map("printing_sides")
  deliveryDate        DateTime? @db.Date @map("delivery_date")
  advanceRequired     Decimal?  @default(0) @db.Decimal(12, 2) @map("advance_required")
  paymentTerms        String?   @map("payment_terms")
  customPaymentTerms  String?   @map("custom_payment_terms")

  @@map("quotations")
}
`;

fs.appendFileSync('c:/Users/HP/Desktop/sales-management-system2/prisma/schema.prisma', quotationSchema);
