import axios from 'axios';

import { env } from '../../shared/config/env';

// Talks DIRECTLY to the payment provider with the public key — this must
// never go through our own backend's httpClient. There's more than one
// plausible sandbox host for this provider; the correct one for this
// project is whatever's configured in .env (see .env.example), not
// necessarily the first one you'd guess from their public docs.
const paymentProviderClient = axios.create({
  baseURL: env.paymentProviderApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.paymentProviderPublicKey}`,
  },
});

export interface TokenizeCardParams {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface PaymentProviderCardToken {
  id: string;
  brand: string;
  lastFour: string;
  expMonth: string;
  expYear: string;
}

interface PaymentProviderTokenizeResponse {
  status: string;
  data: {
    id: string;
    brand: string;
    last_four: string;
    exp_month: string;
    exp_year: string;
  };
}

interface PaymentProviderErrorResponse {
  error: {
    type: string;
    reason?: string;
    messages?: Record<string, string[]>;
  };
}

function describePaymentProviderError(error: unknown): string {
  if (axios.isAxiosError<PaymentProviderErrorResponse>(error) && error.response?.data?.error) {
    const { reason, messages } = error.response.data.error;
    if (reason) return reason;
    if (messages) {
      return Object.values(messages).flat().join(' ');
    }
  }
  return 'No se pudo validar la tarjeta con el proveedor de pagos. Intenta de nuevo.';
}

export async function tokenizeCard(params: TokenizeCardParams): Promise<PaymentProviderCardToken> {
  try {
    const { data } = await paymentProviderClient.post<PaymentProviderTokenizeResponse>('/tokens/cards', {
      number: params.number,
      cvc: params.cvc,
      exp_month: params.expMonth,
      exp_year: params.expYear,
      card_holder: params.cardHolder,
    });

    return {
      id: data.data.id,
      brand: data.data.brand,
      lastFour: data.data.last_four,
      expMonth: data.data.exp_month,
      expYear: data.data.exp_year,
    };
  } catch (error) {
    throw new Error(describePaymentProviderError(error));
  }
}

export default paymentProviderClient;
