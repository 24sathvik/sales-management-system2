const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT false;`);
    console.log("Column hasSeenOnboarding added successfully.");
  } catch (err) {
    console.error("Error adding column:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
