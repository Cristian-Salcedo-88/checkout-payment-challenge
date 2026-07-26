import { DomainError } from '../../common/domain-error';

export class TransactionNotFoundError extends DomainError {
  readonly code = 'TRANSACTION_NOT_FOUND';

  constructor(transactionId: string) {
    super(`Transaction ${transactionId} not found`);
  }
}

export class TransactionAlreadyProcessedError extends DomainError {
  readonly code = 'TRANSACTION_ALREADY_PROCESSED';

  constructor(transactionId: string) {
    super(`Transaction ${transactionId} was already confirmed and cannot be processed again`);
  }
}
