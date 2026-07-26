import { Inject, Injectable } from '@nestjs/common';
import { Result } from '../../common/result';
import { CUSTOMER_REPOSITORY, type CustomerRepository } from '../../domain/customer/customer.repository';
import { DELIVERY_REPOSITORY, type DeliveryRepository } from '../../domain/delivery/delivery.repository';
import { PAYMENT_GATEWAY, type PaymentGatewayPort } from '../../domain/payment/payment-gateway.port';
import { FIXED_PURCHASE_QUANTITY } from '../../domain/product/purchase-quantity.constant';
import { PRODUCT_REPOSITORY, type ProductRepository } from '../../domain/product/product.repository';
import { Transaction } from '../../domain/transaction/transaction.entity';
import { TransactionStatus } from '../../domain/transaction/transaction-status.enum';
import { TransactionAlreadyProcessedError, TransactionNotFoundError } from '../../domain/transaction/transaction.errors';
import { TRANSACTION_REPOSITORY, type TransactionRepository } from '../../domain/transaction/transaction.repository';

export interface ConfirmPaymentCommand {
  transactionId: string;
  cardToken: string;
  deliveryAddress: string;
  deliveryCity: string;
}

export type ConfirmPaymentError = TransactionNotFoundError | TransactionAlreadyProcessedError;

const CHARGE_CURRENCY = 'COP';

@Injectable()
export class ConfirmPaymentUseCase {
  constructor(
    @Inject(TRANSACTION_REPOSITORY) private readonly transactionRepository: TransactionRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepository: ProductRepository,
    @Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepository,
    @Inject(DELIVERY_REPOSITORY) private readonly deliveryRepository: DeliveryRepository,
    @Inject(PAYMENT_GATEWAY) private readonly paymentGateway: PaymentGatewayPort,
  ) {}

  async execute(command: ConfirmPaymentCommand): Promise<Result<Transaction, ConfirmPaymentError>> {
    const transaction = await this.transactionRepository.findById(command.transactionId);

    if (!transaction) {
      return Result.fail(new TransactionNotFoundError(command.transactionId));
    }

    if (!transaction.isPending()) {
      return Result.fail(new TransactionAlreadyProcessedError(transaction.id));
    }

    const stockReserved = await this.productRepository.decrementStock(transaction.productId, FIXED_PURCHASE_QUANTITY);

    if (!stockReserved) {
      const errored = await this.transactionRepository.markAsProcessed(transaction.id, {
        status: TransactionStatus.ERROR,
        gatewayTransactionId: null,
      });
      return Result.ok(errored);
    }

    const customer = await this.customerRepository.findById(transaction.customerId);

    if (!customer) {
      throw new Error(
        `Data integrity error: customer ${transaction.customerId} referenced by transaction ${transaction.id} was not found`,
      );
    }

    const chargeResult = await this.paymentGateway.charge({
      reference: transaction.reference,
      amountInCents: transaction.amount,
      currency: CHARGE_CURRENCY,
      cardToken: command.cardToken,
      customerEmail: customer.email,
    });

    if (chargeResult.isErr) {
      const released = await this.releaseStockAndMark(transaction, TransactionStatus.ERROR, null);
      return Result.ok(released);
    }

    const charge = chargeResult.value;

    if (charge.status !== TransactionStatus.APPROVED) {
      const released = await this.releaseStockAndMark(transaction, charge.status, charge.gatewayTransactionId);
      return Result.ok(released);
    }

    const approved = await this.transactionRepository.runAtomically(async (tx) => {
      const updated = await this.transactionRepository.markAsProcessed(
        transaction.id,
        { status: TransactionStatus.APPROVED, gatewayTransactionId: charge.gatewayTransactionId },
        tx,
      );

      await this.deliveryRepository.create(
        {
          transactionId: transaction.id,
          customerId: transaction.customerId,
          address: command.deliveryAddress,
          city: command.deliveryCity,
        },
        tx,
      );

      return updated;
    });

    return Result.ok(approved);
  }

  private releaseStockAndMark(
    transaction: Transaction,
    status: typeof TransactionStatus.DECLINED | typeof TransactionStatus.ERROR,
    gatewayTransactionId: string | null,
  ): Promise<Transaction> {
    return this.transactionRepository.runAtomically(async (tx) => {
      await this.productRepository.incrementStock(transaction.productId, FIXED_PURCHASE_QUANTITY, tx);
      return this.transactionRepository.markAsProcessed(transaction.id, { status, gatewayTransactionId }, tx);
    });
  }
}
