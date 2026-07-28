import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Testing connection...");
  try {
    // Try to query the User table to see if the schema was applied
    const userCount = await prisma.user.count();
    console.log(`✅ Connection successful! Found ${userCount} users.`);
    
    // Check if admin exists
    const admin = await prisma.user.findFirst({ where: { email: 'admin@inkandprints.com' } });
    if (admin) {
      console.log(`✅ Admin user exists: ${admin.email} (Role: ${admin.role})`);
    } else {
      console.log(`❌ Admin user NOT found!`);
    }
    
    // Check other tables
    const invoiceCount = await prisma.invoice.count();
    console.log(`✅ Invoice table accessible. (Count: ${invoiceCount})`);
    
  } catch (e) {
    console.error("❌ Connection or Schema error:", e.message);
    process.exit(1);
  }
}

main().finally(() => prisma.$disconnect());
