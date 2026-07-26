import { Module } from '@nestjs/common';
import { CUSTOMER_REPOSITORY } from '../../domain/customer/customer.repository';
import { DELIVERY_REPOSITORY } from '../../domain/delivery/delivery.repository';
import { PRODUCT_REPOSITORY } from '../../domain/product/product.repository';
import { TRANSACTION_REPOSITORY } from '../../domain/transaction/transaction.repository';
import { PrismaModule } from './prisma/prisma.module';
import { CustomerPrismaRepository } from './repositories/customer.prisma-repository';
import { DeliveryPrismaRepository } from './repositories/delivery.prisma-repository';
import { ProductPrismaRepository } from './repositories/product.prisma-repository';
import { TransactionPrismaRepository } from './repositories/transaction.prisma-repository';

@Module({
  imports: [PrismaModule],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
    { provide: CUSTOMER_REPOSITORY, useClass: CustomerPrismaRepository },
    { provide: TRANSACTION_REPOSITORY, useClass: TransactionPrismaRepository },
    { provide: DELIVERY_REPOSITORY, useClass: DeliveryPrismaRepository },
  ],
  exports: [PRODUCT_REPOSITORY, CUSTOMER_REPOSITORY, TRANSACTION_REPOSITORY, DELIVERY_REPOSITORY],
})
export class PersistenceModule {}
