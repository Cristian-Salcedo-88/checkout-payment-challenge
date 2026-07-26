import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { DomainError } from '../../common/domain-error';

const NOT_FOUND_CODES = new Set(['PRODUCT_NOT_FOUND', 'CUSTOMER_NOT_FOUND', 'TRANSACTION_NOT_FOUND']);
const CONFLICT_CODES = new Set(['INSUFFICIENT_STOCK', 'TRANSACTION_ALREADY_PROCESSED']);

export function toHttpException(error: DomainError): Error {
  const payload = { code: error.code, message: error.message };

  if (NOT_FOUND_CODES.has(error.code)) {
    return new NotFoundException(payload);
  }

  if (CONFLICT_CODES.has(error.code)) {
    return new ConflictException(payload);
  }

  return new UnprocessableEntityException(payload);
}
