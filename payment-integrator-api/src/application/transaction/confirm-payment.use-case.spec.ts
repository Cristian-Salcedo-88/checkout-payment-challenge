import { Result } from '../../common/result';
import { Customer } from '../../domain/customer/customer.entity';
import { CustomerRepository } from '../../domain/customer/customer.repository';
import { DeliveryRepository } from '../../domain/delivery/delivery.repository';
import { PaymentGatewayError } from '../../domain/payment/payment-gateway.errors';
import { ChargeResult, PaymentGatewayPort } from '../../domain/payment/payment-gateway.port';
import { ProductRepository } from '../../domain/product/product.repository';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { TransactionStatus } from '../../domain/transaction/transaction-status.enum';
import { TransactionAlreadyProcessedError, TransactionNotFoundError } from '../../domain/transaction/transaction.errors';
import { TransactionRepository } from '../../domain/transaction/transaction.repository';
import { ConfirmPaymentUseCase } from './confirm-payment.use-case';

const FAKE_TX = { marker: 'fake-tx' };

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

function buildTransactionRepository(
  overrides: Partial<jest.Mocked<TransactionRepository>> = {},
): jest.Mocked<TransactionRepository> {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    markAsProcessed: jest.fn(),
    runAtomically: jest.fn((work: (tx: unknown) => Promise<unknown>) => work(FAKE_TX)),
    ...overrides,
  };
  return repository as unknown as jest.Mocked<TransactionRepository>;
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

function buildDeliveryRepository(
  overrides: Partial<jest.Mocked<DeliveryRepository>> = {},
): jest.Mocked<DeliveryRepository> {
  return {
    create: jest.fn(),
    ...overrides,
  };
}

function buildPaymentGateway(overrides: Partial<jest.Mocked<PaymentGatewayPort>> = {}): jest.Mocked<PaymentGatewayPort> {
  return {
    charge: jest.fn(),
    ...overrides,
  };
}

describe('ConfirmPaymentUseCase', () => {
  const command = {
    transactionId: 'transaction-1',
    cardToken: 'tok_test_123',
    deliveryAddress: 'Cra 1 # 2-3',
    deliveryCity: 'Bogotá',
  };

  it('fails with TransactionNotFoundError when the transaction does not exist', async () => {
    const transactionRepository = buildTransactionRepository({ findById: jest.fn().mockResolvedValue(null) });
    const useCase = new ConfirmPaymentUseCase(
      transactionRepository,
      buildProductRepository(),
      buildCustomerRepository(),
      buildDeliveryRepository(),
      buildPaymentGateway(),
    );

    const result = await useCase.execute(command);

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(TransactionNotFoundError);
  });

  it('fails with TransactionAlreadyProcessedError when the transaction is not PENDING', async () => {
    const transaction = buildTransaction({ status: TransactionStatus.APPROVED });
    const transactionRepository = buildTransactionRepository({ findById: jest.fn().mockResolvedValue(transaction) });
    const productRepository = buildProductRepository();
    const useCase = new ConfirmPaymentUseCase(
      transactionRepository,
      productRepository,
      buildCustomerRepository(),
      buildDeliveryRepository(),
      buildPaymentGateway(),
    );

    const result = await useCase.execute(command);

    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(TransactionAlreadyProcessedError);
    expect(productRepository.decrementStock).not.toHaveBeenCalled();
  });

  it('marks the transaction as ERROR without calling the payment gateway when stock cannot be reserved', async () => {
    const transaction = buildTransaction();
    const erroredTransaction = buildTransaction({ status: TransactionStatus.ERROR });
    const transactionRepository = buildTransactionRepository({
      findById: jest.fn().mockResolvedValue(transaction),
      markAsProcessed: jest.fn().mockResolvedValue(erroredTransaction),
    });
    const productRepository = buildProductRepository({ decrementStock: jest.fn().mockResolvedValue(false) });
    const customerRepository = buildCustomerRepository();
    const paymentGateway = buildPaymentGateway();

    const useCase = new ConfirmPaymentUseCase(
      transactionRepository,
      productRepository,
      customerRepository,
      buildDeliveryRepository(),
      paymentGateway,
    );

    const result = await useCase.execute(command);

    expect(result.isOk).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.ERROR);
    expect(transactionRepository.markAsProcessed).toHaveBeenCalledWith(transaction.id, {
      status: TransactionStatus.ERROR,
      gatewayTransactionId: null,
    });
    expect(customerRepository.findById).not.toHaveBeenCalled();
    expect(paymentGateway.charge).not.toHaveBeenCalled();
  });

  it('approves the transaction and creates the delivery atomically when the gateway approves', async () => {
    const transaction = buildTransaction();
    const customer = buildCustomer();
    const approvedTransaction = buildTransaction({
      status: TransactionStatus.APPROVED,
      gatewayTransactionId: 'gateway-tx-1',
    });
    const chargeResult: ChargeResult = { gatewayTransactionId: 'gateway-tx-1', status: TransactionStatus.APPROVED };

    const transactionRepository = buildTransactionRepository({
      findById: jest.fn().mockResolvedValue(transaction),
      markAsProcessed: jest.fn().mockResolvedValue(approvedTransaction),
    });
    const productRepository = buildProductRepository({ decrementStock: jest.fn().mockResolvedValue(true) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(customer) });
    const deliveryRepository = buildDeliveryRepository();
    const paymentGateway = buildPaymentGateway({ charge: jest.fn().mockResolvedValue(Result.ok(chargeResult)) });

    const useCase = new ConfirmPaymentUseCase(
      transactionRepository,
      productRepository,
      customerRepository,
      deliveryRepository,
      paymentGateway,
    );

    const result = await useCase.execute(command);

    expect(result.isOk).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.APPROVED);
    expect(productRepository.decrementStock).toHaveBeenCalledWith(transaction.productId, 1);
    expect(productRepository.incrementStock).not.toHaveBeenCalled();
    expect(paymentGateway.charge).toHaveBeenCalledWith({
      reference: transaction.reference,
      amountInCents: transaction.amount,
      currency: 'COP',
      cardToken: command.cardToken,
      customerEmail: customer.email,
    });
    expect(transactionRepository.runAtomically).toHaveBeenCalledTimes(1);
    expect(transactionRepository.markAsProcessed).toHaveBeenCalledWith(
      transaction.id,
      { status: TransactionStatus.APPROVED, gatewayTransactionId: 'gateway-tx-1' },
      FAKE_TX,
    );
    expect(deliveryRepository.create).toHaveBeenCalledWith(
      {
        transactionId: transaction.id,
        customerId: transaction.customerId,
        address: command.deliveryAddress,
        city: command.deliveryCity,
      },
      FAKE_TX,
    );
  });

  it('releases the reserved stock and marks DECLINED when the gateway declines the charge', async () => {
    const transaction = buildTransaction();
    const customer = buildCustomer();
    const declinedTransaction = buildTransaction({
      status: TransactionStatus.DECLINED,
      gatewayTransactionId: 'gateway-tx-2',
    });
    const chargeResult: ChargeResult = { gatewayTransactionId: 'gateway-tx-2', status: TransactionStatus.DECLINED };

    const transactionRepository = buildTransactionRepository({
      findById: jest.fn().mockResolvedValue(transaction),
      markAsProcessed: jest.fn().mockResolvedValue(declinedTransaction),
    });
    const productRepository = buildProductRepository({ decrementStock: jest.fn().mockResolvedValue(true) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(customer) });
    const deliveryRepository = buildDeliveryRepository();
    const paymentGateway = buildPaymentGateway({ charge: jest.fn().mockResolvedValue(Result.ok(chargeResult)) });

    const useCase = new ConfirmPaymentUseCase(
      transactionRepository,
      productRepository,
      customerRepository,
      deliveryRepository,
      paymentGateway,
    );

    const result = await useCase.execute(command);

    expect(result.isOk).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.DECLINED);
    expect(productRepository.incrementStock).toHaveBeenCalledWith(transaction.productId, 1, FAKE_TX);
    expect(transactionRepository.markAsProcessed).toHaveBeenCalledWith(
      transaction.id,
      { status: TransactionStatus.DECLINED, gatewayTransactionId: 'gateway-tx-2' },
      FAKE_TX,
    );
    expect(deliveryRepository.create).not.toHaveBeenCalled();
  });

  it('releases the reserved stock and marks ERROR when the gateway cannot be reached', async () => {
    const transaction = buildTransaction();
    const customer = buildCustomer();
    const erroredTransaction = buildTransaction({ status: TransactionStatus.ERROR });

    const transactionRepository = buildTransactionRepository({
      findById: jest.fn().mockResolvedValue(transaction),
      markAsProcessed: jest.fn().mockResolvedValue(erroredTransaction),
    });
    const productRepository = buildProductRepository({ decrementStock: jest.fn().mockResolvedValue(true) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(customer) });
    const deliveryRepository = buildDeliveryRepository();
    const paymentGateway = buildPaymentGateway({
      charge: jest.fn().mockResolvedValue(Result.fail(new PaymentGatewayError('timeout'))),
    });

    const useCase = new ConfirmPaymentUseCase(
      transactionRepository,
      productRepository,
      customerRepository,
      deliveryRepository,
      paymentGateway,
    );

    const result = await useCase.execute(command);

    expect(result.isOk).toBe(true);
    expect(result.value.status).toBe(TransactionStatus.ERROR);
    expect(productRepository.incrementStock).toHaveBeenCalledWith(transaction.productId, 1, FAKE_TX);
    expect(transactionRepository.markAsProcessed).toHaveBeenCalledWith(
      transaction.id,
      { status: TransactionStatus.ERROR, gatewayTransactionId: null },
      FAKE_TX,
    );
    expect(deliveryRepository.create).not.toHaveBeenCalled();
  });

  it('throws when the customer referenced by the transaction cannot be found', async () => {
    const transaction = buildTransaction();
    const transactionRepository = buildTransactionRepository({ findById: jest.fn().mockResolvedValue(transaction) });
    const productRepository = buildProductRepository({ decrementStock: jest.fn().mockResolvedValue(true) });
    const customerRepository = buildCustomerRepository({ findById: jest.fn().mockResolvedValue(null) });

    const useCase = new ConfirmPaymentUseCase(
      transactionRepository,
      productRepository,
      customerRepository,
      buildDeliveryRepository(),
      buildPaymentGateway(),
    );

    await expect(useCase.execute(command)).rejects.toThrow(/Data integrity error/);
  });
});
