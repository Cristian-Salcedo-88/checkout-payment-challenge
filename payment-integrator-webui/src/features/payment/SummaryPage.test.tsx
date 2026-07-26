import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import checkoutReducer from '../checkout/checkoutSlice';
import type { CheckoutState } from '../checkout/checkoutSlice';
import productReducer from '../product/productSlice';
import type { ProductState } from '../product/productSlice';
import httpClient from '../../shared/api/httpClient';
import paymentReducer from './paymentSlice';
import type { PaymentState } from './paymentSlice';
import SummaryPage from './SummaryPage';

jest.mock('../../shared/api/httpClient', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

const mockedPost = httpClient.post as jest.MockedFunction<typeof httpClient.post>;

const baseProduct: ProductState = {
  current: { id: 'prod_1', name: 'Ceramic Mug', description: 'A mug', price: 4500000, stock: 10 },
  status: 'succeeded',
  error: null,
};

const baseCheckout: CheckoutState = {
  delivery: {
    name: 'Jane Doe',
    email: 'jane@example.com',
    documentId: '123',
    phone: '+573001234567',
    address: 'Cra 1 # 2-3',
    city: 'Bogotá',
  },
  customerId: 'cust_1',
  customerStatus: 'succeeded',
  customerError: null,
  card: { token: 'tok_123', brand: 'visa', lastFour: '4242' },
};

const basePayment: PaymentState = {
  transactionId: 'txn_1',
  reference: 'ref_1',
  backendStatus: 'PENDING',
  phase: 'idle',
  amount: 4730000,
  baseFee: 150000,
  deliveryFee: 80000,
  errorMessage: null,
};

function renderSummary({
  product = baseProduct,
  checkout = baseCheckout,
  payment = basePayment,
}: { product?: ProductState; checkout?: CheckoutState; payment?: PaymentState } = {}) {
  const store = configureStore({
    reducer: { product: productReducer, checkout: checkoutReducer, payment: paymentReducer },
    preloadedState: { product, checkout, payment },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/summary']}>
        <Routes>
          <Route path="/summary" element={<SummaryPage />} />
          <Route path="/checkout" element={<div>checkout screen</div>} />
          <Route path="/result" element={<div>result screen</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return { store };
}

describe('SummaryPage', () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  it('shows the product, fee lines and the correctly calculated total', () => {
    renderSummary();

    expect(screen.getByText('Ceramic Mug')).toBeInTheDocument();
    // 4,500,000 + 150,000 + 80,000 cents = 4,730,000 cents = $47,300 COP
    expect(screen.getByText(/47[.,]300/)).toBeInTheDocument();
  });

  it('redirects to /checkout when there is no transaction yet', () => {
    renderSummary({ payment: { ...basePayment, transactionId: null } });
    expect(screen.getByText('checkout screen')).toBeInTheDocument();
  });

  it('disables the pay button when there is no card token', () => {
    renderSummary({ checkout: { ...baseCheckout, card: { token: null, brand: 'unknown', lastFour: null } } });
    expect(screen.getByRole('button', { name: /pagar/i })).toBeDisabled();
  });

  it('confirms the transaction and navigates to the result screen on approval', async () => {
    mockedPost.mockResolvedValue({
      data: {
        id: 'txn_1',
        reference: 'ref_1',
        productId: 'prod_1',
        customerId: 'cust_1',
        amount: 4730000,
        baseFee: 150000,
        deliveryFee: 80000,
        status: 'APPROVED',
        // Real backend JSON field name — see paymentSlice's RawTransactionResponse.
        wompiTransactionId: 'gtw_txn_1',
        createdAt: '2026-07-25T00:00:00.000Z',
        updatedAt: '2026-07-25T00:00:00.000Z',
      },
    });
    const user = userEvent.setup();
    renderSummary();

    await user.click(screen.getByRole('button', { name: /pagar/i }));

    expect(mockedPost).toHaveBeenCalledWith('/transactions/txn_1/confirm', {
      cardToken: 'tok_123',
      deliveryAddress: 'Cra 1 # 2-3',
      deliveryCity: 'Bogotá',
    });
    await waitFor(() => expect(screen.getByText('result screen')).toBeInTheDocument());
  });
});
