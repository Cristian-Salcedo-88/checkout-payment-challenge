import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import httpClient from '../../shared/api/httpClient';

export type BackendTransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR';

// 'confirming' covers the ~20s the backend can block while it polls the
// payment provider internally. 'polling' is our own client-side fallback —
// used mainly to recover after a refresh mid-payment, when the in-flight
// confirm request was lost but the backend kept processing independently of
// our connection.
export type PaymentPhase = 'idle' | 'creating' | 'confirming' | 'polling' | 'done' | 'error';

// The backend's actual JSON response shape. `wompiTransactionId` is that
// field's real name in our backend's API — an external contract we don't
// control, not a naming choice of ours — so it's confined to this one raw
// type and mapped away immediately below.
interface RawTransactionResponse {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  amount: number;
  baseFee: number;
  deliveryFee: number;
  status: BackendTransactionStatus;
  wompiTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponseDto {
  id: string;
  reference: string;
  productId: string;
  customerId: string;
  amount: number;
  baseFee: number;
  deliveryFee: number;
  status: BackendTransactionStatus;
  paymentProviderTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

function toTransactionResponseDto(raw: RawTransactionResponse): TransactionResponseDto {
  const { wompiTransactionId, ...rest } = raw;
  return { ...rest, paymentProviderTransactionId: wompiTransactionId };
}

export interface PaymentState {
  transactionId: string | null;
  reference: string | null;
  backendStatus: BackendTransactionStatus | null;
  phase: PaymentPhase;
  amount: number | null;
  baseFee: number | null;
  deliveryFee: number | null;
  errorMessage: string | null;
}

const initialState: PaymentState = {
  transactionId: null,
  reference: null,
  backendStatus: null,
  phase: 'idle',
  amount: null,
  baseFee: null,
  deliveryFee: null,
  errorMessage: null,
};

export const createTransaction = createAsyncThunk<
  TransactionResponseDto,
  { productId: string; customerId: string }
>('payment/createTransaction', async ({ productId, customerId }) => {
  const { data } = await httpClient.post<RawTransactionResponse>('/transactions', {
    productId,
    customerId,
  });
  return toTransactionResponseDto(data);
});

interface ConfirmArgs {
  transactionId: string;
  cardToken: string;
  deliveryAddress: string;
  deliveryCity: string;
}

export const confirmTransaction = createAsyncThunk<TransactionResponseDto, ConfirmArgs>(
  'payment/confirmTransaction',
  async ({ transactionId, cardToken, deliveryAddress, deliveryCity }) => {
    const { data } = await httpClient.post<RawTransactionResponse>(
      `/transactions/${transactionId}/confirm`,
      { cardToken, deliveryAddress, deliveryCity },
    );
    return toTransactionResponseDto(data);
  },
);

const POLL_INTERVAL_MS = 2_000;
const MAX_POLL_ATTEMPTS = 10;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Only needed as a fallback: if the confirm HTTP call was interrupted (e.g.
// the user refreshed mid-payment), this re-derives the true status straight
// from our backend instead of trusting a persisted-but-stale "confirming".
export const pollTransactionStatus = createAsyncThunk<TransactionResponseDto, string>(
  'payment/pollTransactionStatus',
  async (transactionId) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      const { data } = await httpClient.get<RawTransactionResponse>(`/transactions/${transactionId}`);
      if (data.status !== 'PENDING') return toTransactionResponseDto(data);
      await sleep(POLL_INTERVAL_MS);
    }
    throw new Error('El pago sigue en proceso. Intenta consultar el estado en un momento.');
  },
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    resetPayment() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTransaction.pending, (state) => {
        state.phase = 'creating';
        state.errorMessage = null;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        const { id, reference, amount, baseFee, deliveryFee, status } = action.payload;
        state.transactionId = id;
        state.reference = reference;
        state.amount = amount;
        state.baseFee = baseFee;
        state.deliveryFee = deliveryFee;
        state.backendStatus = status;
        state.phase = 'idle';
      })
      .addCase(createTransaction.rejected, (state, action) => {
        state.phase = 'error';
        state.errorMessage = action.error.message ?? 'No se pudo iniciar la transacción.';
      })
      .addCase(confirmTransaction.pending, (state) => {
        state.phase = 'confirming';
        state.errorMessage = null;
      })
      .addCase(confirmTransaction.fulfilled, (state, action) => {
        state.backendStatus = action.payload.status;
        state.phase = action.payload.status === 'PENDING' ? 'polling' : 'done';
      })
      .addCase(confirmTransaction.rejected, (state, action) => {
        state.phase = 'error';
        state.errorMessage = action.error.message ?? 'No se pudo confirmar el pago.';
      })
      .addCase(pollTransactionStatus.pending, (state) => {
        state.phase = 'polling';
        state.errorMessage = null;
      })
      .addCase(pollTransactionStatus.fulfilled, (state, action) => {
        state.backendStatus = action.payload.status;
        state.phase = 'done';
      })
      .addCase(pollTransactionStatus.rejected, (state, action) => {
        state.phase = 'error';
        state.errorMessage = action.error.message ?? 'No se pudo confirmar el estado del pago.';
      });
  },
});

export const { resetPayment } = paymentSlice.actions;

export default paymentSlice.reducer;
