import { Customer } from '../../domain/customer/customer.entity';
import { CustomerNotFoundError } from '../../domain/customer/customer.errors';
import { CustomerRepository } from '../../domain/customer/customer.repository';
import { Product } from '../../domain/product/product.entity';
import { InsufficientStockError, ProductNotFoundError } from '../../domain/product/product.errors';
import { ProductRepository } from '../../domain/product/product.repository';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { TransactionStatus } from '../../domain/transaction/transaction-status.enum';
import { TransactionRepository } from '../../domain/transaction/transaction.repository';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { BASE_FEE_IN_CENTS, DELIVERY_FEE_IN_CENTS } from './pricing.constants';

function buildProduct(overrides: Partial<ConstructorParameters<typeof Product>[0]> = {}): Product {
  return new Product({
    id: 'product-1',
    name: 'Test Mug',
    description: 'A mug',
    price: 5_000_000,
    imageUrl: 'http://example.com/mug.png',
    stock: 5,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function buildCustomer(overrides: Partial<ConstructorParameters<typeof Customer>[0]> = {}): Customer {
  return new Customer({
    id: 'customer-1',
    name: 'Jane Doe',
    email: 'jane@example.com',
    documentId: '123456789',
    phone: '+573001234567',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function buildTransaction(overrides: Partial<ConstructorParameters<typeof Transaction>[0]> = {}): Transaction {
  return new Transaction({
    id: 'transaction-1',
    reference: 'TXN-abc',
    productId: 'product-1',
    customerId: 'customer-1',
    amount: 5_000_000 + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS,
    baseFee: BASE_FEE_IN_CENTS,
    deliveryFee: DELIVERY_FEE_IN_CENTS,
    status: TransactionStatus.PENDING,
    gatewayTransactionId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  });
}

function buildProductRepository(overrides: Partial<jest.Mocked<ProductRepository>> = {}): jest.Mocked<ProductRepository> {
  return {
    findAllInStock: jest.fn(),
    findById: jest.fn(),
    decrementStock: jest.fn(),
    incrementStock: jest.fn(),
    ...overrides,
  };
}

function buildCustomerRepository(
  overrides: Partial<jest.Mocked<CustomerRepository>> = {},
): jest.Mocked<CustomerRepository> {
  return {
    findById: jest.fn(),
    upsertByDocumentId: jest.fn(),
    ...overrides,
  };
}

function buildTransactionRepository(
  overrides: Partial<jest.Mocked<TransactionRepository>> = {},
): jest.Mocked<TransactionRepository> {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    markAsProcessed: jest.fn(),
    runAtomically: jest.fn(),
    ...overrides,
  };
  return repository as unknown as jest.Mocked<TransactionRepository>;
}

describe('CreateTransactionUseCase', () => {
  it('creates a PENDING transaction with amount = price + baseFee + deliveryFee', async () => {
    const product = buildProduct();
    const customer = buildCustomer();
    const transaction = buildTransaction();

    const productRepository = buildProductRepository({ findById: jest.fn().mockResolvedValue(product) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(customer) });
    const transactionRepository = buildTransactionRepository({ create: jest.fn().mockResolvedValue(transaction) });

    const useCase = new CreateTransactionUseCase(productRepository, customerRepository, transactionRepository);
    const result = await useCase.execute({ productId: product.id, customerId: customer.id });

    expect(result.isOk).toBe(true);
    expect(result.value).toBe(transaction);
    expect(transactionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: product.id,
        customerId: customer.id,
        amount: product.price + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS,
        baseFee: BASE_FEE_IN_CENTS,
        deliveryFee: DELIVERY_FEE_IN_CENTS,
        reference: expect.stringMatching(/^TXN-/),
      }),
    );
  });

  it('fails with ProductNotFoundError when the product does not exist', async () => {
    const customer = buildCustomer();
    const productRepository = buildProductRepository({ findById: jest.fn().mockResolvedValue(null) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(customer) });
    const transactionRepository = buildTransactionRepository();

    const useCase = new CreateTransactionUseCase(productRepository, customerRepository, transactionRepository);
    const result = await useCase.execute({ productId: 'missing-product', customerId: customer.id });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(ProductNotFoundError);
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('fails with CustomerNotFoundError when the customer does not exist', async () => {
    const product = buildProduct();
    const productRepository = buildProductRepository({ findById: jest.fn().mockResolvedValue(product) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(null) });
    const transactionRepository = buildTransactionRepository();

    const useCase = new CreateTransactionUseCase(productRepository, customerRepository, transactionRepository);
    const result = await useCase.execute({ productId: product.id, customerId: 'missing-customer' });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(CustomerNotFoundError);
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });

  it('fails with InsufficientStockError when the product has no stock left', async () => {
    const product = buildProduct({ stock: 0 });
    const customer = buildCustomer();
    const productRepository = buildProductRepository({ findById: jest.fn().mockResolvedValue(product) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(customer) });
    const transactionRepository = buildTransactionRepository();

    const useCase = new CreateTransactionUseCase(productRepository, customerRepository, transactionRepository);
    const result = await useCase.execute({ productId: product.id, customerId: customer.id });

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(InsufficientStockError);
    expect(transactionRepository.create).not.toHaveBeenCalled();
  });
});
