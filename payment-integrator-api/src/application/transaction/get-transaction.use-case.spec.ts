import { Transaction } from '../../domain/transaction/transaction.entity';
import { TransactionStatus } from '../../domain/transaction/transaction-status.enum';
import { TransactionNotFoundError } from '../../domain/transaction/transaction.errors';
import { TransactionRepository } from '../../domain/transaction/transaction.repository';
import { GetTransactionUseCase } from './get-transaction.use-case';

function buildTransaction(overrides: Partial<ConstructorParameters<typeof Transaction>[0]> = {}): Transaction {
  return new Transaction({
    id: 'transaction-1',
    reference: 'TXN-abc',
    productId: 'product-1',
    customerId: 'customer-1',
    amount: 6_300_000,
    baseFee: 500_000,
    deliveryFee: 800_000,
    status: TransactionStatus.PENDING,
    gatewayTransactionId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function buildRepository(overrides: Partial<jest.Mocked<TransactionRepository>> = {}): jest.Mocked<TransactionRepository> {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    markAsProcessed: jest.fn(),
    runAtomically: jest.fn(),
    ...overrides,
  };
  return repository as unknown as jest.Mocked<TransactionRepository>;
}

describe('GetTransactionUseCase', () => {
  it('returns Ok with the transaction when it exists', async () => {
    const transaction = buildTransaction();
    const transactionRepository = buildRepository({ findById: jest.fn().mockResolvedValue(transaction) });

    const useCase = new GetTransactionUseCase(transactionRepository);
    const result = await useCase.execute('transaction-1');

    expect(result.isOk).toBe(true);
    expect(result.value).toBe(transaction);
  });

  it('returns Err with TransactionNotFoundError when the transaction does not exist', async () => {
    const transactionRepository = buildRepository({ findById: jest.fn().mockResolvedValue(null) });

    const useCase = new GetTransactionUseCase(transactionRepository);
    const result = await useCase.execute('missing-id');

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(TransactionNotFoundError);
  });
});
