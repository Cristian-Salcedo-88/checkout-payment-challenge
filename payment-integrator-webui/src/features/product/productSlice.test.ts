import productReducer, { loadProduct } from './productSlice';
import type { ProductState } from './productSlice';

const initialState: ProductState = { current: null, status: 'idle', error: null };

describe('productSlice', () => {
  it('sets status to loading and clears the error on pending', () => {
    const withError: ProductState = { ...initialState, status: 'failed', error: 'previous error' };
    const state = productReducer(withError, { type: loadProduct.pending.type });

    expect(state.status).toBe('loading');
    expect(state.error).toBeNull();
  });

  it('stores the product and marks succeeded on fulfilled', () => {
    const product = { id: '1', name: 'Mug', description: 'x', price: 1000, stock: 5 };
    const state = productReducer(initialState, {
      type: loadProduct.fulfilled.type,
      payload: product,
    });

    expect(state.status).toBe('succeeded');
    expect(state.current).toEqual(product);
  });

  it('marks failed and stores the error message on rejected', () => {
    const state = productReducer(initialState, {
      type: loadProduct.rejected.type,
      error: { message: 'Network error' },
    });

    expect(state.status).toBe('failed');
    expect(state.error).toBe('Network error');
  });
});
