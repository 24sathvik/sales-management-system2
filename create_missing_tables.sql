-- CreateEnum
CREATE TYPE "quotation_status" AS ENUM ('draft', 'sent', 'accepted', 'rejected');

-- AlterTable
ALTER TABLE "ChecklistTemplate" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WIPCard" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "quotations" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
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
    "created_by" TEXT,
    "invoice_id" TEXT,
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

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "quotations_quotation_number_key" ON "quotations"("quotation_number");

-- AddForeignKey
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

