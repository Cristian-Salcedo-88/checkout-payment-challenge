import { DomainError } from '../../common/domain-error';

export class ProductNotFoundError extends DomainError {
  readonly code = 'PRODUCT_NOT_FOUND';

  constructor(productId: string) {
    super(`Product ${productId} not found`);
  }
}

export class InsufficientStockError extends DomainError {
  readonly code = 'INSUFFICIENT_STOCK';

  constructor(productId: string, requested: number, available: number) {
    super(`Product ${productId} has insufficient stock: requested ${requested}, available ${available}`);
  }
}
