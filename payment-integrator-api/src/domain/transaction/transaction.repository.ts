import type { TransactionContext } from '../../common/transaction-context';
import { Transaction } from './transaction.entity';
import { TransactionStatus } from './transaction-status.enum';

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');

export interface CreateTransactionInput {
  reference: string;
  productId: string;
  customerId: string;
  amount: number;
  baseFee: number;
  deliveryFee: number;
}

export interface MarkTransactionProcessedInput {
  status: typeof TransactionStatus.APPROVED | typeof TransactionStatus.DECLINED | typeof TransactionStatus.ERROR;
  gatewayTransactionId: string | null;
}

export interface TransactionRepository {
  create(input: CreateTransactionInput): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  markAsProcessed(id: string, input: MarkTransactionProcessedInput, tx?: TransactionContext): Promise<Transaction>;
  /**
   * Opens a persistence-level atomic transaction and hands its context to
   * `work`, so other repositories can join the same atomic write by passing
   * that context through their own `tx` parameter.
   */
  runAtomically<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
