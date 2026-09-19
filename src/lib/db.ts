import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function createPrismaClient(): PrismaClient {
  if (process.env.VERCEL) {
    const tmpDb = '/tmp/dev.db';
    if (!fs.existsSync(tmpDb)) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'dev.db'),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDb);
            break;
          } catch (e) {
            console.error('Error copying db to /tmp on Vercel:', e);
          }
        }
      }
    }
    return new PrismaClient({
      datasources: { db: { url: `file:${tmpDb}` } },
      log: ['error'],
    });
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

