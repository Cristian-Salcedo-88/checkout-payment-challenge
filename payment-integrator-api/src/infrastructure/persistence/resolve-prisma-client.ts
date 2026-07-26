import type { TransactionContext } from '../../common/transaction-context';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from './prisma/prisma.service';

export function resolvePrismaClient(
  prisma: PrismaService,
  tx?: TransactionContext,
): PrismaService | Prisma.TransactionClient {
  return (tx as Prisma.TransactionClient | undefined) ?? prisma;
}
