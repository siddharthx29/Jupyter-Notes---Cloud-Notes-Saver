import { PrismaClient } from '@prisma/client';

const fallbackDbUrl =
  'postgresql://neondb_owner:npg_Fawbcq3TBWG5@ep-steep-rice-az161rc4-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const databaseUrl = process.env.DATABASE_URL || fallbackDbUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
