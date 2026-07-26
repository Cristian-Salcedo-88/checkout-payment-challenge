import { Customer } from './customer.entity';

export const CUSTOMER_REPOSITORY = Symbol('CUSTOMER_REPOSITORY');

export interface UpsertCustomerInput {
  name: string;
  email: string;
  documentId: string;
  phone: string;
}

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
  upsertByDocumentId(input: UpsertCustomerInput): Promise<Customer>;
}
