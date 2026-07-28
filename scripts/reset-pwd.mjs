import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hash = "$2b$10$HhEbU3HzHPV4h4JUzPieauIZ/9woQzno7d1kqBqm1G6n1lrMMMs4C"; // Equivalent to 'admin123' generated locally
  await prisma.user.update({
    where: { email: 'admin@inkandprints.com' },
    data: { password: hash }
  });
  console.log("Password reset for admin@inkandprints.com");
}

main().finally(() => prisma.$disconnect());
