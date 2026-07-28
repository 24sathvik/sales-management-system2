import { PrismaClient, Role } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding ...");

  const adminPassword = hashSync("Admin@123", 12);
  const staffPassword = hashSync("Password123", 12);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@zyops.com" },
    update: { password: adminPassword },
    create: {
      email: "admin@zyops.com",
      name: "System Admin",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });
  console.log(`Created admin user with id: ${admin.id}`);

  // Create Regular User 1
  const user1 = await prisma.user.upsert({
    where: { email: "staff1@zyops.com" },
    update: { password: staffPassword },
    create: {
      email: "staff1@zyops.com",
      name: "Staff Member 1",
      password: staffPassword,
      role: Role.USER,
    },
  });
  console.log(`Created regular user with id: ${user1.id}`);

  // Create Regular User 2
  const user2 = await prisma.user.upsert({
    where: { email: "staff2@zyops.com" },
    update: { password: staffPassword },
    create: {
      email: "staff2@zyops.com",
      name: "Staff Member 2",
      password: staffPassword,
      role: Role.USER,
    },
  });
  console.log(`Created regular user with id: ${user2.id}`);

  console.log("Seeding finished.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
