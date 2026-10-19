import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

export const getPrisma = (): PrismaClient => {
  if (!prismaInstance) {
    try {
      prismaInstance = new PrismaClient();
    } catch (err: any) {
      console.warn('⚠️ [Prisma] Client initialization deferred:', err.message);
      prismaInstance = new PrismaClient();
    }
  }
  return prismaInstance;
};

const prisma = getPrisma();
export default prisma;
