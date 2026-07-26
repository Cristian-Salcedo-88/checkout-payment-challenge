import { DomainError } from '../../common/domain-error';

export class CustomerNotFoundError extends DomainError {
  readonly code = 'CUSTOMER_NOT_FOUND';

  constructor(customerId: string) {
    super(`Customer ${customerId} not found`);
  }
}
