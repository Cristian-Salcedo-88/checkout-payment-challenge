import checkoutReducer, {
  clearCard,
  resetCheckout,
  setCardToken,
  submitCustomer,
  updateDeliveryField,
} from './checkoutSlice';
import type { CheckoutState } from './checkoutSlice';

const initialState: CheckoutState = {
  delivery: { name: '', email: '', documentId: '', phone: '', address: '', city: '' },
  customerId: null,
  customerStatus: 'idle',
  customerError: null,
  card: { token: null, brand: 'unknown', lastFour: null },
};

describe('checkoutSlice', () => {
  it('updates a single delivery field without touching the others', () => {
    const state = checkoutReducer(
      initialState,
      updateDeliveryField({ field: 'city', value: 'Bogotá' }),
    );

    expect(state.delivery.city).toBe('Bogotá');
    expect(state.delivery.name).toBe('');
  });

  it('stores the card token, brand and last four digits', () => {
    const state = checkoutReducer(
      initialState,
      setCardToken({ token: 'tok_123', brand: 'visa', lastFour: '4242' }),
    );

    expect(state.card).toEqual({ token: 'tok_123', brand: 'visa', lastFour: '4242' });
  });

  it('clears the card back to its empty state', () => {
    const withCard: CheckoutState = {
      ...initialState,
      card: { token: 'tok_123', brand: 'visa', lastFour: '4242' },
    };
    const state = checkoutReducer(withCard, clearCard());

    expect(state.card).toEqual({ token: null, brand: 'unknown', lastFour: null });
  });

  it('resets the whole checkout state', () => {
    const dirty: CheckoutState = {
      delivery: { name: 'Jane', email: 'a@b.com', documentId: '1', phone: '2', address: '3', city: '4' },
      customerId: 'cust_1',
      customerStatus: 'succeeded',
      customerError: null,
      card: { token: 'tok_123', brand: 'visa', lastFour: '4242' },
    };

    expect(checkoutReducer(dirty, resetCheckout())).toEqual(initialState);
  });

  describe('submitCustomer lifecycle', () => {
    it('sets loading status and clears prior errors on pending', () => {
      const withError: CheckoutState = {
        ...initialState,
        customerStatus: 'failed',
        customerError: 'previous error',
      };
      const state = checkoutReducer(withError, { type: submitCustomer.pending.type });

      expect(state.customerStatus).toBe('loading');
      expect(state.customerError).toBeNull();
    });

    it('stores the customer id and marks succeeded on fulfilled', () => {
      const state = checkoutReducer(initialState, {
        type: submitCustomer.fulfilled.type,
        payload: { id: 'cust_1', name: 'Jane', email: 'a@b.com', documentId: '1', phone: '2' },
      });

      expect(state.customerStatus).toBe('succeeded');
      expect(state.customerId).toBe('cust_1');
    });

    it('marks failed and stores the error message on rejected', () => {
      const state = checkoutReducer(initialState, {
        type: submitCustomer.rejected.type,
        error: { message: 'Network error' },
      });

      expect(state.customerStatus).toBe('failed');
      expect(state.customerError).toBe('Network error');
    });
  });
});
