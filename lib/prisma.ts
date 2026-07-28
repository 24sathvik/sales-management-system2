/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, react-hooks/exhaustive-deps */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  }).$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Soft delete filter extension
          // Applies ONLY if the model actually has a deletedAt field
          const modelsWithSoftDelete = [
            'Invoice', 'Lead', 'WIPCard', 'FinalCheck', 
            'Purchase', 'MonthlyExpense', 'CounterTransaction'
          ];
          if (
            modelsWithSoftDelete.includes(model) &&
            operation &&
            ['findMany', 'findFirst', 'findUnique', 'count'].includes(operation as string)
          ) {
            (args as any).where = { ...(args as any).where, deletedAt: null };
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient; // Cast to retain standard client types for now

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

