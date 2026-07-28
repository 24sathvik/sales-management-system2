import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await hash("Admin@12345", 10);
  
  await prisma.user.upsert({
    where: { email: "admin@printflowpro.com" },
    update: {
      password: hashedPassword,
    },
    create: {
      email: "admin@printflowpro.com",
      name: "PrintFlow Admin",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("Admin password updated. Email: admin@printflowpro.com, Password: Admin@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
