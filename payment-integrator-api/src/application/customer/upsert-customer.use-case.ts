import { Inject, Injectable } from '@nestjs/common';
import { Customer } from '../../domain/customer/customer.entity';
import {
  CUSTOMER_REPOSITORY,
  type CustomerRepository,
  type UpsertCustomerInput,
} from '../../domain/customer/customer.repository';

@Injectable()
export class UpsertCustomerUseCase {
  constructor(@Inject(CUSTOMER_REPOSITORY) private readonly customerRepository: CustomerRepository) {}

  execute(input: UpsertCustomerInput): Promise<Customer> {
    return this.customerRepository.upsertByDocumentId(input);
  }
}
