import { Result } from '../../common/result';
import { TransactionStatus } from '../transaction/transaction-status.enum';
import { PaymentGatewayError } from './payment-gateway.errors';

export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface ChargeRequest {
  reference: string;
  amountInCents: number;
  currency: string;
  cardToken: string;
  customerEmail: string;
}

export interface ChargeResult {
  gatewayTransactionId: string;
  status: typeof TransactionStatus.APPROVED | typeof TransactionStatus.DECLINED | typeof TransactionStatus.ERROR;
}

export interface PaymentGatewayPort {
  /**
   * Resolves with Ok even when the gateway reports a declined/errored charge —
   * that's a valid business outcome. Only failing to get a definitive
   * answer from the gateway (timeout, network error, malformed response) is an Err.
   */
  charge(request: ChargeRequest): Promise<Result<ChargeResult, PaymentGatewayError>>;
}
