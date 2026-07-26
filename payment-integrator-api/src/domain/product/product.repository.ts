import type { TransactionContext } from '../../common/transaction-context';
import { Product } from './product.entity';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAllInStock(): Promise<Product[]>;
  /**
   * Atomically decrements stock only if enough stock is still available.
   * Returns false (no-op) if the product doesn't exist or stock < quantity.
   */
  decrementStock(id: string, quantity: number, tx?: TransactionContext): Promise<boolean>;
  /** Compensating action to release a reservation made by decrementStock. */
  incrementStock(id: string, quantity: number, tx?: TransactionContext): Promise<void>;
}
