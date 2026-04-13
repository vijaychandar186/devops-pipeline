import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

let _prisma: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!_prisma) {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (!connectionString) throw new Error('DATABASE_URL is not set');
    const adapter = new PrismaPg({ connectionString });
    _prisma = new PrismaClient({ adapter });
  }
  return _prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop: string) {
    return getClient()[prop as keyof PrismaClient];
  }
});
