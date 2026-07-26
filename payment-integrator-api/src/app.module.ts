import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CustomerModule } from './infrastructure/http/customer/customer.module';
import { ProductModule } from './infrastructure/http/product/product.module';
import { TransactionModule } from './infrastructure/http/transaction/transaction.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ProductModule, CustomerModule, TransactionModule],
})
export class AppModule {}
