import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import { Result } from '../../common/result';
import {
  type ChargeRequest,
  type ChargeResult,
  type PaymentGatewayPort,
} from '../../domain/payment/payment-gateway.port';
import { PaymentGatewayError } from '../../domain/payment/payment-gateway.errors';
import { TransactionStatus } from '../../domain/transaction/transaction-status.enum';
import { buildIntegritySignature } from './integrity-signature';

type GatewayRawStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

interface GatewayTransactionSnapshot {
  id: string;
  status: GatewayRawStatus;
}

interface AcceptanceTokens {
  acceptanceToken: string;
  acceptPersonalAuthToken: string;
}

const MAX_POLL_ATTEMPTS = 10;
const POLL_INTERVAL_MS = 2_000;

function isTerminalStatus(status: GatewayRawStatus): boolean {
  return status !== 'PENDING';
}

function toChargeStatus(status: GatewayRawStatus): ChargeResult['status'] {
  if (status === 'APPROVED') return TransactionStatus.APPROVED;
  if (status === 'DECLINED') return TransactionStatus.DECLINED;
  // VOIDED has no equivalent in our domain vocabulary; treat as ERROR.
  return TransactionStatus.ERROR;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class PaymentGatewayHttpClient implements PaymentGatewayPort {
  private readonly logger = new Logger(PaymentGatewayHttpClient.name);
  private readonly baseUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integritySecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_BASE_URL');
    this.publicKey = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_PUBLIC_KEY');
    this.privateKey = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_PRIVATE_KEY');
    this.integritySecret = this.configService.getOrThrow<string>('PAYMENT_GATEWAY_INTEGRITY_SECRET');
  }

  async charge(request: ChargeRequest): Promise<Result<ChargeResult, PaymentGatewayError>> {
    let snapshot: GatewayTransactionSnapshot;

    try {
      const tokens = await this.fetchAcceptanceTokens();
      const signature = buildIntegritySignature({
        reference: request.reference,
        amountInCents: request.amountInCents,
        currency: request.currency,
        integritySecret: this.integritySecret,
      });

      snapshot = await this.createTransaction(request, signature, tokens);
    } catch (error) {
      this.logger.error(
        `Failed to create the payment gateway transaction for reference ${request.reference}: ${this.describeError(error)}`,
      );
      return Result.fail(new PaymentGatewayError('Could not create the transaction with the payment gateway'));
    }

    let attempts = 0;
    while (!isTerminalStatus(snapshot.status) && attempts < MAX_POLL_ATTEMPTS) {
      await sleep(POLL_INTERVAL_MS);
      attempts++;

      try {
        snapshot = await this.fetchTransaction(snapshot.id);
      } catch (error) {
        this.logger.warn(
          `Polling attempt ${attempts}/${MAX_POLL_ATTEMPTS} failed for gateway transaction ${snapshot.id}: ${this.describeError(error)}`,
        );
      }
    }

    if (!isTerminalStatus(snapshot.status)) {
      this.logger.error(
        `Gateway transaction ${snapshot.id} did not resolve after ${MAX_POLL_ATTEMPTS} polling attempts`,
      );
      return Result.fail(new PaymentGatewayError(`Gateway transaction ${snapshot.id} timed out waiting for a final status`));
    }

    return Result.ok({
      gatewayTransactionId: snapshot.id,
      status: toChargeStatus(snapshot.status),
    });
  }

  private async fetchAcceptanceTokens(): Promise<AcceptanceTokens> {
    const response = await firstValueFrom(this.httpService.get(`${this.baseUrl}/merchants/${this.publicKey}`));
    const merchant = response.data.data;

    return {
      acceptanceToken: merchant.presigned_acceptance.acceptance_token,
      acceptPersonalAuthToken: merchant.presigned_personal_data_auth.acceptance_token,
    };
  }

  private async createTransaction(
    request: ChargeRequest,
    signature: string,
    tokens: AcceptanceTokens,
  ): Promise<GatewayTransactionSnapshot> {
    const response = await firstValueFrom(
      this.httpService.post(
        `${this.baseUrl}/transactions`,
        {
          amount_in_cents: request.amountInCents,
          currency: request.currency,
          customer_email: request.customerEmail,
          reference: request.reference,
          signature,
          acceptance_token: tokens.acceptanceToken,
          accept_personal_auth: tokens.acceptPersonalAuthToken,
          payment_method: {
            type: 'CARD',
            token: request.cardToken,
            installments: 1,
          },
        },
        { headers: this.authHeaders() },
      ),
    );

    const data = response.data.data;
    return { id: data.id, status: data.status };
  }

  private async fetchTransaction(id: string): Promise<GatewayTransactionSnapshot> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/transactions/${id}`, { headers: this.authHeaders() }),
    );

    const data = response.data.data;
    return { id: data.id, status: data.status };
  }

  private authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${this.privateKey}` };
  }

  private describeError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const errorType = (error.response?.data as { error?: { type?: string } } | undefined)?.error?.type;
      return `HTTP ${error.response?.status ?? 'unknown'} - ${errorType ?? error.message}`;
    }
    return error instanceof Error ? error.message : 'unknown error';
  }
}
