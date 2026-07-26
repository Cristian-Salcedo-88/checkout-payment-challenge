import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import httpClient from '../../shared/api/httpClient';

export interface DeliveryFormData {
  name: string;
  email: string;
  documentId: string;
  phone: string;
  address: string;
  city: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'unknown';

interface CardState {
  token: string | null;
  brand: CardBrand;
  lastFour: string | null;
}

export interface CheckoutState {
  delivery: DeliveryFormData;
  customerId: string | null;
  customerStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  customerError: string | null;
  // SECURITY: the raw card number and CVV are NEVER dispatched into this
  // (persisted) store. They live only in local component state inside
  // CardModal for as long as it takes to call the payment provider's
  // tokenization API, then get discarded. Only the resulting token and
  // display-safe metadata (brand, last 4 digits) are kept here.
  card: CardState;
}

const emptyDelivery: DeliveryFormData = {
  name: '',
  email: '',
  documentId: '',
  phone: '',
  address: '',
  city: '',
};

const emptyCard: CardState = { token: null, brand: 'unknown', lastFour: null };

const initialState: CheckoutState = {
  delivery: emptyDelivery,
  customerId: null,
  customerStatus: 'idle',
  customerError: null,
  card: emptyCard,
};

interface CustomerResponseDto {
  id: string;
  name: string;
  email: string;
  documentId: string;
  phone: string;
}

// Creates (or updates — the backend upserts by document id) the customer
// record needed before a transaction can be created.
export const submitCustomer = createAsyncThunk<CustomerResponseDto, DeliveryFormData>(
  'checkout/submitCustomer',
  async (delivery) => {
    const { data } = await httpClient.post<CustomerResponseDto>('/customers', {
      name: delivery.name,
      email: delivery.email,
      documentId: delivery.documentId,
      phone: delivery.phone,
    });
    return data;
  },
);

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    updateDeliveryField(
      state,
      action: PayloadAction<{ field: keyof DeliveryFormData; value: string }>,
    ) {
      state.delivery[action.payload.field] = action.payload.value;
    },
    setCardToken(state, action: PayloadAction<CardState>) {
      state.card = action.payload;
    },
    clearCard(state) {
      state.card = emptyCard;
    },
    resetCheckout() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitCustomer.pending, (state) => {
        state.customerStatus = 'loading';
        state.customerError = null;
      })
      .addCase(submitCustomer.fulfilled, (state, action) => {
        state.customerStatus = 'succeeded';
        state.customerId = action.payload.id;
      })
      .addCase(submitCustomer.rejected, (state, action) => {
        state.customerStatus = 'failed';
        state.customerError = action.error.message ?? 'No se pudo guardar tus datos.';
      });
  },
});

export const { updateDeliveryField, setCardToken, clearCard, resetCheckout } = checkoutSlice.actions;

export default checkoutSlice.reducer;
