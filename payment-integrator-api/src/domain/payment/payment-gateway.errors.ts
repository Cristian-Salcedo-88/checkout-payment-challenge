import { DomainError } from '../../common/domain-error';

export class PaymentGatewayError extends DomainError {
  readonly code = 'PAYMENT_GATEWAY_ERROR';

  constructor(message: string) {
    super(message);
  }
}
