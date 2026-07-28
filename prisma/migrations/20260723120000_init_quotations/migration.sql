-- CreateEnum
CREATE TYPE "quotation_status" AS ENUM ('draft', 'sent', 'accepted', 'rejected');

-- CreateTable
CREATE TABLE "quotations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "quotation_number" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "customer_address" TEXT,
    "items" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discount_percent" DECIMAL(5,2) DEFAULT 0,
    "discount_amount" DECIMAL(12,2) DEFAULT 0,
    "tax_percent" DECIMAL(5,2) DEFAULT 0,
    "tax_amount" DECIMAL(12,2) DEFAULT 0,
    "total_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "valid_until" DATE,
    "status" "quotation_status" NOT NULL DEFAULT 'draft',
    "created_by" UUID,
    "invoice_id" UUID,
    "created_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "company_name" TEXT,
    "job_title" TEXT,
    "category" TEXT,
    "printing_color" TEXT,
    "paper_size" TEXT,
    "paper_type" TEXT,
    "finish_type" TEXT,
    "printing_sides" TEXT,
    "delivery_date" DATE,
    "advance_required" DECIMAL(12,2) DEFAULT 0,
    "payment_terms" TEXT,
    "custom_payment_terms" TEXT,

    CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");
