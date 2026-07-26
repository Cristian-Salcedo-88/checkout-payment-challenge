import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../common/result';
import { CUSTOMER_REPOSITORY, type CustomerRepository } from '../../domain/customer/customer.repository';
import { CustomerNotFoundError } from '../../domain/customer/customer.errors';
import { InsufficientStockError, ProductNotFoundError } from '../../domain/product/product.errors';
import { FIXED_PURCHASE_QUANTITY } from '../../domain/product/purchase-quantity.constant';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/product/product.repository';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { TRANSACTION_REPOSITORY, type TransactionRepository } from '../../domain/transaction/transaction.repository';
import { BASE_FEE_IN_CENTS, DELIVERY_FEE_IN_CENTS } from './pricing.constants';

export interface CreateTransactionCommand {
  productId: string;
  customerId: string;
}

export type CreateTransactionError = ProductNotFoundError | CustomerNotFoundError | InsufficientStockError;

@Injectable()
export class CreateTransactionUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepository,
  ) {}

  async execute(command: CreateTransactionCommand): Promise<Result<Transaction, CreateTransactionError>> {
    const [product, customer] = await Promise.all([
      this.productRepository.findById(command.productId),
      this.customerRepository.findById(command.customerId),
    ]);

    if (!product) {
      return Result.fail(new ProductNotFoundError(command.productId));
    }

    if (!customer) {
      return Result.fail(new CustomerNotFoundError(command.customerId));
    }

    if (!product.hasSufficientStock(FIXED_PURCHASE_QUANTITY)) {
      return Result.fail(new InsufficientStockError(product.id, FIXED_PURCHASE_QUANTITY, product.stock));
    }

    const transaction = await this.transactionRepository.create({
      reference: `TXN-${randomUUID()}`,
      productId: product.id,
      customerId: customer.id,
      amount: product.price + BASE_FEE_IN_CENTS + DELIVERY_FEE_IN_CENTS,
      baseFee: BASE_FEE_IN_CENTS,
      deliveryFee: DELIVERY_FEE_IN_CENTS,
    });

    return Result.ok(transaction);
  }
}
