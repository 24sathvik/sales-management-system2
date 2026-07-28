const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { hash } = require('bcryptjs');

async function main() {
  console.log("Seeding demo data...");

  // 1. Clear existing data (safely cascade)
  await prisma.transaction.deleteMany();
  await prisma.wIPChecklist.deleteMany();
  await prisma.wIPCard.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.user.deleteMany({
    where: {
      email: { not: "admin@admin.com" } // Keep existing admin if any
    }
  });

  // 2. Create users
  let admin = await prisma.user.findUnique({ where: { email: "admin@admin.com" } });
  if (!admin) {
    const hashedPassword = await hash("admin", 10);
    admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@admin.com",
        password: hashedPassword,
        role: "ADMIN"
      }
    });
  }

  const salesUser = await prisma.user.create({
    data: {
      name: "Alex Sales",
      email: "alex@demo.com",
      password: await hash("password", 10),
      role: "USER"
    }
  });

  // 3. Create Quotations
  const quotations = await Promise.all([
    prisma.quotation.create({
      data: {
        quotation_number: "QUO-001",
        customer_name: "Acme Corp",
        customer_email: "contact@acme.com",
        customer_phone: "555-0101",
        customer_address: "123 Innovation Dr",
        items: [
          { description: "Brochure Design", qty: 1000, unit_price: 15 }
        ],
        subtotal: 15000,
        tax_amount: 2700,
        tax_percent: 18,
        total_amount: 17700,
        status: "accepted",
        created_by_id: admin.id,
        valid_until: new Date(Date.now() + 86400000 * 7),
        notes: JSON.stringify({ leadSource: "Website", followUpDate: new Date(Date.now() + 86400000 * 2) })
      }
    }),
    prisma.quotation.create({
      data: {
        quotation_number: "QUO-002",
        customer_name: "Globex Inc",
        items: [{ description: "Business Cards", qty: 5000, unit_price: 5 }],
        subtotal: 25000,
        tax_amount: 4500,
        tax_percent: 18,
        total_amount: 29500,
        status: "sent",
        created_by_id: salesUser.id,
        valid_until: new Date(Date.now() + 86400000 * 14)
      }
    })
  ]);

  // 4. Create Invoices
  const today = new Date();
  
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        invoiceNumber: 1001,
        customerName: "Acme Corp",
        phone: "555-0101",
        description: "Brochure Design & Print",
        category: "Offset Print",
        quantity: 1000,
        unitRate: 15,
        totalAmount: 17700,
        advancePaid: false,
        status: "ACTIVE",
        contentConfirmedOn: new Date(today.getTime() - 86400000 * 5),
        finalDeliveryDate: new Date(today.getTime() + 86400000 * 2), // Due in 2 days
        createdById: admin.id,
        assigneeId: admin.id
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 1002,
        customerName: "Initech",
        description: "Vinyl Banners",
        category: "Large Format",
        quantity: 5,
        unitRate: 2000,
        totalAmount: 11800,
        advancePaid: true,
        advanceAmount: 5900,
        status: "ACTIVE",
        contentConfirmedOn: new Date(today.getTime() - 86400000 * 2),
        finalDeliveryDate: new Date(today.getTime() + 86400000 * 5),
        createdById: salesUser.id,
        assigneeId: salesUser.id
      }
    }),
    prisma.invoice.create({
      data: {
        invoiceNumber: 1003,
        customerName: "Umbrella Corp",
        description: "Signage Setup",
        category: "Signage",
        quantity: 1,
        unitRate: 50000,
        totalAmount: 59000,
        status: "CLOSED",
        createdById: admin.id
      }
    })
  ]);

  // Link Q1 to INV1
  await prisma.quotation.update({
    where: { id: quotations[0].id },
    data: { invoice_id: invoices[0].id }
  });

  // 5. Create WIP Cards
  await Promise.all([
    prisma.wIPCard.create({
      data: {
        invoiceId: invoices[0].id,
        phase: "PRINTING",
        order: 0,
        designer: "John",
        printer: "Alice",
        checklists: {
          create: [
            { text: "Check files", isCompleted: true, completedBy: "John" },
            { text: "Load paper", isCompleted: false }
          ]
        }
      }
    }),
    prisma.wIPCard.create({
      data: {
        invoiceId: invoices[1].id,
        phase: "DESIGN",
        order: 0,
        designer: "Jane"
      }
    })
  ]);

  // 6. Create Transactions
  await prisma.transaction.create({
    data: {
      type: "CREDIT",
      amount: 5900,
      date: new Date(today.getTime() - 86400000 * 2),
      mode: "ONLINE",
      category: "INVOICE_ADVANCE",
      description: "Advance for Inv 1002",
      invoiceNumber: "1002",
      invoiceId: invoices[1].id,
      userId: salesUser.id
    }
  });
  await prisma.transaction.create({
    data: {
      type: "CREDIT",
      amount: 59000,
      date: new Date(today.getTime() - 86400000 * 10),
      mode: "BANK_TRANSFER",
      category: "INVOICE_FULL_PAYMENT",
      description: "Full payment Inv 1003",
      invoiceNumber: "1003",
      invoiceId: invoices[2].id,
      userId: admin.id
    }
  });

  console.log("Demo data seeded successfully.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
