import { Injectable } from '@nestjs/common';
import type { Transaction as PrismaTransaction } from '../../../../generated/prisma/client';
import type { TransactionContext } from '../../../common/transaction-context';
import { Transaction } from '../../../domain/transaction/transaction.entity';
import {
  CreateTransactionInput,
  MarkTransactionProcessedInput,
  TransactionRepository,
} from '../../../domain/transaction/transaction.repository';
import { PrismaService } from '../prisma/prisma.service';
import { resolvePrismaClient } from '../resolve-prisma-client';

function toDomain(record: PrismaTransaction): Transaction {
  return new Transaction({
    id: record.id,
    reference: record.reference,
    productId: record.productId,
    customerId: record.customerId,
    amount: record.amount,
    baseFee: record.baseFee,
    deliveryFee: record.deliveryFee,
    status: record.status,
    gatewayTransactionId: record.gatewayTransactionId,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

@Injectable()
export class TransactionPrismaRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateTransactionInput): Promise<Transaction> {
    const record = await this.prisma.transaction.create({ data: input });
    return toDomain(record);
  }

  async findById(id: string): Promise<Transaction | null> {
    const record = await this.prisma.transaction.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async markAsProcessed(
    id: string,
    input: MarkTransactionProcessedInput,
    tx?: TransactionContext,
  ): Promise<Transaction> {
    const client = resolvePrismaClient(this.prisma, tx);
    const record = await client.transaction.update({
      where: { id },
      data: { status: input.status, gatewayTransactionId: input.gatewayTransactionId },
    });
    return toDomain(record);
  }

  runAtomically<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(tx));
  }
}
