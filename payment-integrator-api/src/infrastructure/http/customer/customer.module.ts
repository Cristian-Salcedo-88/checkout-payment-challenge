import { Module } from '@nestjs/common';
import { UpsertCustomerUseCase } from '../../../application/customer/upsert-customer.use-case';
import { PersistenceModule } from '../../persistence/persistence.module';
import { CustomerController } from './customer.controller';

@Module({
  imports: [PersistenceModule],
  controllers: [CustomerController],
  providers: [UpsertCustomerUseCase],
})
export class CustomerModule {}
