import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import httpClient from '../../shared/api/httpClient';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface ProductState {
  current: Product | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProductState = {
  current: null,
  status: 'idle',
  error: null,
};

// Pass a known id to refresh that exact product (e.g. the redirect back here
// once the payment flow resolves). Omit it for the very first load, when we
// don't have one yet — GET /products only returns items with stock, so the
// first one stands in for "the" product in this single-product flow.
export const loadProduct = createAsyncThunk<Product, string | undefined>(
  'product/load',
  async (productId) => {
    if (productId) {
      const { data } = await httpClient.get<Product>(`/products/${productId}`);
      return data;
    }

    const { data } = await httpClient.get<Product[]>('/products');
    if (data.length === 0) {
      throw new Error('No hay productos disponibles en este momento.');
    }
    return data[0];
  },
);

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadProduct.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadProduct.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload;
      })
      .addCase(loadProduct.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? 'No se pudo cargar el producto.';
      });
  },
});

export default productSlice.reducer;
