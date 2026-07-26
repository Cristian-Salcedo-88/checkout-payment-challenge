import type { TransactionContext } from '../../common/transaction-context';
import { Delivery } from './delivery.entity';

export const DELIVERY_REPOSITORY = Symbol('DELIVERY_REPOSITORY');

export interface CreateDeliveryInput {
  transactionId: string;
  customerId: string;
  address: string;
  city: string;
}

export interface DeliveryRepository {
  create(input: CreateDeliveryInput, tx?: TransactionContext): Promise<Delivery>;
}
