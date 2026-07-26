import { Module } from '@nestjs/common';
import { ConfirmPaymentUseCase } from '../../../application/transaction/confirm-payment.use-case';
import { CreateTransactionUseCase } from '../../../application/transaction/create-transaction.use-case';
import { GetTransactionUseCase } from '../../../application/transaction/get-transaction.use-case';
import { PersistenceModule } from '../../persistence/persistence.module';
import { PaymentGatewayModule } from '../../payment-gateway/payment-gateway.module';
import { TransactionController } from './transaction.controller';

@Module({
  imports: [PersistenceModule, PaymentGatewayModule],
  controllers: [TransactionController],
  providers: [CreateTransactionUseCase, ConfirmPaymentUseCase, GetTransactionUseCase],
})
export class TransactionModule {}
