const { Client } = require("pg");
require("dotenv").config();

const SECTIONS = [
  {
    id: "A",
    title: "Order Verification",
    items: [
      { key: "rm_billNumberVerified", label: "Order details verified with client" },
      { key: "rm_modelNumberVerified", label: "Quantity & Scope confirmed" },
      { key: "rm_descriptionVerified", label: "Specifications reviewed" },
      { key: "rm_quantityVerified", label: "Delivery date confirmed with client" },
      { key: "rm_printerAssigned", label: "Advance payment received/recorded" },
      { key: "rm_dtpAssigned", label: "Job card created" },
      { key: "rm_colourExplainedToCustomer", label: "Materials/resources allocated" },
      { key: "rm_leadTimeExplained", label: "Staff assigned" },
      { key: "rm_wastageRemarksAdjusted", label: "Timeline communicated internally" },
      { key: "rm_dtpAssignedAndStarted", label: "Client approval on specs obtained" },
    ]
  },
  {
    id: "B",
    title: "Execution & Production",
    items: [
      { key: "d_materialCardsReceived", label: "Production/Execution started on schedule" },
      { key: "d_dtpConfirmed", label: "Initial quality check passed" },
      { key: "d_cardsStockUpdated", label: "Mid-production review done" },
      { key: "d_currentStockChecked", label: "No resource wastage issues" },
      { key: "d_stickersQualityChecked", label: "Staff productivity on track" },
    ]
  },
  {
    id: "C",
    title: "Quality Control",
    items: [
      { key: "p_namePlatesReceived1", label: "Functional/Visual requirements met" },
      { key: "p_namePlatesQualityChecked", label: "Final internal QA passed" },
      { key: "p_dtpConfirmedByCustomer", label: "Compliance standards verified" },
    ]
  },
  {
    id: "D",
    title: "Delivery Preparation",
    items: [
      { key: "pp_paddingBoxingScheduled", label: "Client notified of readiness" },
      { key: "pp_printedMaterialReceived", label: "Final payment/balance cleared" },
      { key: "pp_printedMaterialQC", label: "Delivery scheduled/Dispatched" },
      { key: "pp_cardsToBinder", label: "Feedback collected" },
    ]
  }
];

const PHASE_CHECKLIST_FIELDS = {
  "RAW_MATERIALS": [
    "rm_billNumberVerified", "rm_modelNumberVerified", "rm_descriptionVerified", 
    "rm_quantityVerified", "rm_printerAssigned", "rm_dtpAssigned", 
    "rm_colourExplainedToCustomer", "rm_leadTimeExplained", 
    "rm_wastageRemarksAdjusted", "rm_dtpAssignedAndStarted"
  ],
  "DESIGN": [
    "d_materialCardsReceived", "d_dtpConfirmed", "d_cardsStockUpdated", 
    "d_currentStockChecked", "d_stickersQualityChecked", "d_stickerQualityUpdated", 
    "d_logoCheckedOnDtp", "d_printerScheduleInformed", "d_dtpSentToCustomer"
  ],
  "PRINTING": [
    "p_namePlatesReceived1", "p_namePlatesQualityChecked", "p_dtpConfirmedByCustomer", 
    "p_namePlatesReceivedFinal", "p_signaturesFromCustomer", "p_leadTimeUpdated", 
    "p_leftRightExplained", "p_masterTracingsReady", "p_samplesCollectedFromDtp", 
    "p_masterCheckWithPdfCard", "p_timeColourWrittenOnCards", "p_timeColourSentInGroup", 
    "p_cardOrientationSentToGroup", "p_materialSentToPrinter", "p_estimatedPrintingDateSet", 
    "p_printerFollowUp", "p_cardOrientationConfirmed"
  ],
  "POST_PRINTING": [
    "pp_paddingBoxingScheduled", "pp_printedMaterialReceived", "pp_printedMaterialQC", 
    "pp_cardsToBinder", "pp_binderFollowUp", "pp_estimatedTimeToBinder", 
    "pp_endProductCheck", "pp_sampleExchanged", "pp_customerInformedBag", 
    "pp_customerInformedReadiness", "pp_paymentCollected", "pp_reminderFollowUp", 
    "pp_ratingTaken", "pp_checkRatingName", "pp_balanceCollected"
  ],
  "PAYMENT_PENDING": [
    "pay_invoiceAmountConfirmed", "pay_paymentReminderSent", "pay_partialPaymentReceived", 
    "pay_fullPaymentReceived", "pay_receiptIssued"
  ]
};

const crypto = require('crypto');
function uuid() {
  return crypto.randomUUID();
}

async function createSchema(client) {
  console.log("Creating new checklist tables via native pg connection...");
  
  const sqlStatements = [
    `CREATE TABLE IF NOT EXISTS "ChecklistTemplate" (
        "id" TEXT NOT NULL,
        "phase" "WIPPhase",
        "name" TEXT NOT NULL,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "ChecklistTemplate_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE TABLE IF NOT EXISTS "ChecklistItem" (
        "id" TEXT NOT NULL,
        "templateId" TEXT NOT NULL,
        "label" TEXT NOT NULL,
        "key" TEXT,
        "order" INTEGER NOT NULL,
        "isRequired" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
    );`,
    `CREATE TABLE IF NOT EXISTS "ChecklistResponse" (
        "id" TEXT NOT NULL,
        "wipCardId" TEXT,
        "finalCheckId" TEXT,
        "itemId" TEXT NOT NULL,
        "isChecked" BOOLEAN NOT NULL DEFAULT false,
        "checkedAt" TIMESTAMP(3),
        "checkedBy" TEXT,
        CONSTRAINT "ChecklistResponse_pkey" PRIMARY KEY ("id")
    );`,
    
    // Foreign keys
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChecklistItem_templateId_fkey') THEN
        ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ChecklistTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`,
    
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChecklistResponse_wipCardId_fkey') THEN
        ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_wipCardId_fkey" FOREIGN KEY ("wipCardId") REFERENCES "WIPCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChecklistResponse_finalCheckId_fkey') THEN
        ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_finalCheckId_fkey" FOREIGN KEY ("finalCheckId") REFERENCES "FinalCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`,

    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ChecklistResponse_itemId_fkey') THEN
        ALTER TABLE "ChecklistResponse" ADD CONSTRAINT "ChecklistResponse_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ChecklistItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;`,

    `CREATE INDEX IF NOT EXISTS "ChecklistResponse_wipCardId_idx" ON "ChecklistResponse"("wipCardId");`,
    `CREATE INDEX IF NOT EXISTS "ChecklistResponse_finalCheckId_idx" ON "ChecklistResponse"("finalCheckId");`,
    `CREATE INDEX IF NOT EXISTS "ChecklistResponse_itemId_idx" ON "ChecklistResponse"("itemId");`
  ];

  for (const sql of sqlStatements) {
    try {
      await client.query(sql);
    } catch (e) {
      console.log("Error or already executed:", e.message);
    }
  }
}

function getLabelForKey(key) {
  const withoutPrefix = key.split('_').slice(1).join('_');
  const spaced = withoutPrefix.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

async function seedData(client) {
  console.log("Seeding templates...");
  
  for (const [phase, keys] of Object.entries(PHASE_CHECKLIST_FIELDS)) {
    const existingRes = await client.query('SELECT id FROM "ChecklistTemplate" WHERE phase = $1', [phase]);
    
    let templateId;
    if (existingRes.rows.length === 0) {
      templateId = uuid();
      await client.query(
        'INSERT INTO "ChecklistTemplate" (id, phase, name) VALUES ($1, $2, $3)',
        [templateId, phase, `${phase.replace('_', ' ')} Checklist`]
      );
      
      let order = 0;
      for (const key of keys) {
        await client.query(
          'INSERT INTO "ChecklistItem" (id, "templateId", label, key, "order", "isRequired") VALUES ($1, $2, $3, $4, $5, $6)',
          [uuid(), templateId, getLabelForKey(key), key, order++, true]
        );
      }
      console.log(`Created template for ${phase} with ${keys.length} items`);
    }
  }

  const existingFinalRes = await client.query('SELECT id FROM "ChecklistTemplate" WHERE phase IS NULL');
  
  if (existingFinalRes.rows.length === 0) {
    const finalTemplateId = uuid();
    await client.query(
      'INSERT INTO "ChecklistTemplate" (id, phase, name) VALUES ($1, $2, $3)',
      [finalTemplateId, null, "Final Quality Check"]
    );
    
    let order = 0;
    for (const sec of SECTIONS) {
      for (const item of sec.items) {
        await client.query(
          'INSERT INTO "ChecklistItem" (id, "templateId", label, key, "order", "isRequired") VALUES ($1, $2, $3, $4, $5, $6)',
          [uuid(), finalTemplateId, item.label, item.key, order++, true]
        );
      }
    }
    console.log(`Created Final Check template with ${order} items`);
  }
}

async function migrateResponses(client) {
  console.log("Migrating WIP checklists responses...");
  
  const allTemplatesRes = await client.query('SELECT id, phase FROM "ChecklistTemplate"');
  const allItemsRes = await client.query('SELECT id, "templateId", key FROM "ChecklistItem"');
  
  const oldChecklistsRes = await client.query('SELECT * FROM "WIPChecklist"');
  console.log(`Found ${oldChecklistsRes.rows.length} old WIP checklists...`);
  
  for (const old of oldChecklistsRes.rows) {
    const template = allTemplatesRes.rows.find(t => t.phase === old.phase);
    if (!template) continue;
    
    const templateItems = allItemsRes.rows.filter(i => i.templateId === template.id);
    
    for (const item of templateItems) {
      if (old[item.key] === true) {
        const existsRes = await client.query(
          'SELECT id FROM "ChecklistResponse" WHERE "wipCardId" = $1 AND "itemId" = $2',
          [old.wipCardId, item.id]
        );
        if (existsRes.rows.length === 0) {
          await client.query(
            'INSERT INTO "ChecklistResponse" (id, "wipCardId", "itemId", "isChecked", "checkedAt") VALUES ($1, $2, $3, $4, $5)',
            [uuid(), old.wipCardId, item.id, true, old.updatedAt]
          );
        }
      }
    }
  }
  
  console.log("Migration complete.");
}

async function main() {
  let connStr = process.env.DIRECT_URL;
  if (!connStr) connStr = process.env.DATABASE_URL;
  if (connStr) connStr = connStr.split('?')[0];
  
  const client = new Client({ connectionString: connStr });
  
  try {
    await client.connect();
    await createSchema(client);
    await seedData(client);
    await migrateResponses(client);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

main();
