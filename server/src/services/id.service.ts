import { PrismaClient, Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '../utils/prisma';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export async function generateId(
  prefix: string,
  tx?: TransactionClient
): Promise<string> {
  const client = tx || defaultPrisma;

  // Atomic increment — upsert ensures counter exists
  const counter = await client.idCounter.upsert({
    where: { prefix },
    update: { currentValue: { increment: 1 } },
    create: { prefix, currentValue: 1 },
  });

  const padded = String(counter.currentValue).padStart(3, '0');
  return `${prefix}-${padded}`;
}
