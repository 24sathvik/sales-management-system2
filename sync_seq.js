const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Invoice"', 'invoiceNumber'), (SELECT COALESCE(MAX("invoiceNumber"), 1) FROM "Invoice"));`);
  console.log("Sequence synced");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
