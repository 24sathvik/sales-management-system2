// scripts/migrate.mjs
// Run: node scripts/migrate.mjs
// Uses DATABASE_URL (pooler port 6543) to push schema DDL without needing direct port 5432 access

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const statements = [
  // ENUMs
  `DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "AdvanceMode" AS ENUM ('ONLINE', 'CASH'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "BalanceMode" AS ENUM ('ONLINE', 'CASH'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "PackingType" AS ENUM ('WITH_PACKING', 'WITHOUT_PACKING'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "InvoiceStatus" AS ENUM ('ACTIVE', 'CLOSED'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'NEGOTIATING', 'CONVERTED', 'LOST'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
  `DO $$ BEGIN CREATE TYPE "WIPPhase" AS ENUM ('RAW_MATERIALS', 'DESIGN', 'PRINTING', 'POST_PRINTING'); EXCEPTION WHEN duplicate_object THEN null; END $$`,

  // User table
  `CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`,

  // Invoice table
  `CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" SERIAL NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "brideName" TEXT NOT NULL,
    "groomName" TEXT NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" INTEGER NOT NULL,
    "toleranceQuantity" INTEGER NOT NULL,
    "unitRate" DECIMAL(65,30) NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "advancePaid" BOOLEAN NOT NULL DEFAULT false,
    "advanceAmount" DECIMAL(65,30),
    "advanceMode" "AdvanceMode",
    "balance" DECIMAL(65,30),
    "balancePaid" BOOLEAN NOT NULL DEFAULT false,
    "balanceMode" "BalanceMode",
    "estimatedDesignTime" TEXT NOT NULL,
    "estimatedPrintTime" TEXT NOT NULL,
    "packing" "PackingType" NOT NULL,
    "printingColor" TEXT,
    "designer" TEXT,
    "printer" TEXT,
    "additionalNotes" TEXT,
    "contentConfirmedOn" TIMESTAMP(3),
    "finalDeliveryDate" TIMESTAMP(3),
    "assigneeId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_finalDeliveryDate_idx" ON "Invoice"("finalDeliveryDate")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_assigneeId_idx" ON "Invoice"("assigneeId")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status")`,
  `CREATE INDEX IF NOT EXISTS "Invoice_deletedAt_idx" ON "Invoice"("deletedAt")`,

  // Lead table
  `CREATE TABLE IF NOT EXISTS "Lead" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "assignedToId" TEXT NOT NULL,
    "estimatedBillValue" DECIMAL(65,30) NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE INDEX IF NOT EXISTS "Lead_assignedToId_idx" ON "Lead"("assignedToId")`,
  `CREATE INDEX IF NOT EXISTS "Lead_status_idx" ON "Lead"("status")`,
  `CREATE INDEX IF NOT EXISTS "Lead_deletedAt_idx" ON "Lead"("deletedAt")`,

  // WIPCard table
  `CREATE TABLE IF NOT EXISTS "WIPCard" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "customerName" TEXT NOT NULL,
    "phase" "WIPPhase" NOT NULL DEFAULT 'RAW_MATERIALS',
    "order" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WIPCard_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "WIPCard_invoiceId_key" ON "WIPCard"("invoiceId")`,
  `CREATE INDEX IF NOT EXISTS "WIPCard_phase_idx" ON "WIPCard"("phase")`,
  `CREATE INDEX IF NOT EXISTS "WIPCard_deletedAt_idx" ON "WIPCard"("deletedAt")`,
  `CREATE INDEX IF NOT EXISTS "WIPCard_order_idx" ON "WIPCard"("order")`,

  // FinalCheck table
  `CREATE TABLE IF NOT EXISTS "FinalCheck" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "designer" TEXT,
    "printer" TEXT,
    "quantity" INTEGER NOT NULL,
    "modelNumber" TEXT NOT NULL,
    "billNumberVerified" BOOLEAN NOT NULL DEFAULT false,
    "modelNumberVerified" BOOLEAN NOT NULL DEFAULT false,
    "descriptionVerified" BOOLEAN NOT NULL DEFAULT false,
    "quantityVerified" BOOLEAN NOT NULL DEFAULT false,
    "printerVerified" BOOLEAN NOT NULL DEFAULT false,
    "dtpVerified" BOOLEAN NOT NULL DEFAULT false,
    "colourExplainedToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeExplainedToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "wastageRemarksAdjusted" BOOLEAN NOT NULL DEFAULT false,
    "dtpAssignedAndStarted" BOOLEAN NOT NULL DEFAULT false,
    "materialCardsReceived" BOOLEAN NOT NULL DEFAULT false,
    "dtpConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "cardsStockUpdated" BOOLEAN NOT NULL DEFAULT false,
    "currentStockChecked" BOOLEAN NOT NULL DEFAULT false,
    "stickersQualityCheckedPacked" BOOLEAN NOT NULL DEFAULT false,
    "stickerQualityUpdated" BOOLEAN NOT NULL DEFAULT false,
    "logoCheckedOnDtp" BOOLEAN NOT NULL DEFAULT false,
    "printerScheduleInformed" BOOLEAN NOT NULL DEFAULT false,
    "dtpSentToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "namePlatesReceived1" BOOLEAN NOT NULL DEFAULT false,
    "namePlatesQualityChecked" BOOLEAN NOT NULL DEFAULT false,
    "dtpConfirmedByCustomer" BOOLEAN NOT NULL DEFAULT false,
    "namePlatesReceivedFinal" BOOLEAN NOT NULL DEFAULT false,
    "signaturesFromCustomer" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeUpdatedToCustomer" BOOLEAN NOT NULL DEFAULT false,
    "leftRightExplained" BOOLEAN NOT NULL DEFAULT false,
    "masterTracingsReady" BOOLEAN NOT NULL DEFAULT false,
    "samplesCollectedFromDtp" BOOLEAN NOT NULL DEFAULT false,
    "masterCheckWithPdfCard" BOOLEAN NOT NULL DEFAULT false,
    "timeColourLanguageWrittenOnCards" BOOLEAN NOT NULL DEFAULT false,
    "timeColourLanguageSentInGroup" BOOLEAN NOT NULL DEFAULT false,
    "cardOrientationSentToGroup" BOOLEAN NOT NULL DEFAULT false,
    "materialSentToPrinter" BOOLEAN NOT NULL DEFAULT false,
    "estimatedPrintingDateSet" BOOLEAN NOT NULL DEFAULT false,
    "printerFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "cardOrientationSentToPrinterGroup" BOOLEAN NOT NULL DEFAULT false,
    "paddingBoxingScheduleInformed" BOOLEAN NOT NULL DEFAULT false,
    "printedMaterialReceived" BOOLEAN NOT NULL DEFAULT false,
    "printedMaterialQualityChecked" BOOLEAN NOT NULL DEFAULT false,
    "cardsNamePlatesStickersToBinder" BOOLEAN NOT NULL DEFAULT false,
    "binderFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "estimatedTimeToBinder" BOOLEAN NOT NULL DEFAULT false,
    "endProductMaterialCheck" BOOLEAN NOT NULL DEFAULT false,
    "sampleExchangedWithOriginal" BOOLEAN NOT NULL DEFAULT false,
    "customerInformedToBringBag" BOOLEAN NOT NULL DEFAULT false,
    "customerInformedAboutReadiness" BOOLEAN NOT NULL DEFAULT false,
    "paymentCollected" BOOLEAN NOT NULL DEFAULT false,
    "reminderFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "ratingTaken" BOOLEAN NOT NULL DEFAULT false,
    "checkRatingName" BOOLEAN NOT NULL DEFAULT false,
    "balanceCollected" BOOLEAN NOT NULL DEFAULT false,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinalCheck_pkey" PRIMARY KEY ("id")
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "FinalCheck_invoiceId_key" ON "FinalCheck"("invoiceId")`,
  `CREATE INDEX IF NOT EXISTS "FinalCheck_deletedAt_idx" ON "FinalCheck"("deletedAt")`,
  `CREATE INDEX IF NOT EXISTS "FinalCheck_isComplete_idx" ON "FinalCheck"("isComplete")`,

  // Foreign keys
  `ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_assigneeId_fkey"`,
  `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Invoice" DROP CONSTRAINT IF EXISTS "Invoice_createdById_fkey"`,
  `ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_assignedToId_fkey"`,
  `ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_createdById_fkey"`,
  `ALTER TABLE "Lead" ADD CONSTRAINT "Lead_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "WIPCard" DROP CONSTRAINT IF EXISTS "WIPCard_invoiceId_fkey"`,
  `ALTER TABLE "WIPCard" ADD CONSTRAINT "WIPCard_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "FinalCheck" DROP CONSTRAINT IF EXISTS "FinalCheck_invoiceId_fkey"`,
  `ALTER TABLE "FinalCheck" ADD CONSTRAINT "FinalCheck_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
];

async function main() {
  console.log('🚀 Starting DB schema migration via pooler...\n');
  
  let success = 0;
  let failed = 0;
  
  for (const stmt of statements) {
    const preview = stmt.replace(/\s+/g, ' ').trim().substring(0, 80);
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`✅ ${preview}...`);
      success++;
    } catch (err) {
      console.error(`❌ FAILED: ${preview}...`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\n✨ Done: ${success} succeeded, ${failed} failed`);
  
  // Regenerate Prisma client to pick up schema
  if (failed === 0) {
    console.log('\n📦 Schema applied successfully!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
