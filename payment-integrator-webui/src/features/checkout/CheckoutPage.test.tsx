import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import httpClient from '../../shared/api/httpClient';
import paymentReducer from '../payment/paymentSlice';
import { tokenizeCard } from '../payment/paymentProviderClient';
import productReducer from '../product/productSlice';
import type { ProductState } from '../product/productSlice';
import CheckoutPage from './CheckoutPage';
import checkoutReducer from './checkoutSlice';

jest.mock('../../shared/api/httpClient', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));
jest.mock('../payment/paymentProviderClient', () => ({
  tokenizeCard: jest.fn(),
}));

const mockedPost = httpClient.post as jest.MockedFunction<typeof httpClient.post>;
const mockedTokenizeCard = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;

const baseProduct: ProductState = {
  current: { id: 'prod_1', name: 'Ceramic Mug', description: 'A mug', price: 4500000, stock: 10 },
  status: 'succeeded',
  error: null,
};

function renderCheckout() {
  const store = configureStore({
    reducer: { product: productReducer, checkout: checkoutReducer, payment: paymentReducer },
    preloadedState: { product: baseProduct },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/summary" element={<div>summary screen</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return { store };
}

async function fillDeliveryForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nombre completo/i), 'Jane Doe');
  await user.type(screen.getByLabelText(/correo electrónico/i), 'jane@example.com');
  await user.type(screen.getByLabelText(/documento de identidad/i), '1020304050');
  await user.type(screen.getByLabelText(/teléfono/i), '+573001234567');
  await user.type(screen.getByLabelText(/^dirección$/i), 'Cra 1 # 2-3');
  await user.type(screen.getByLabelText(/^ciudad$/i), 'Bogotá');
}

async function addCard(user: ReturnType<typeof userEvent.setup>) {
  mockedTokenizeCard.mockResolvedValue({
    id: 'tok_123',
    brand: 'VISA',
    lastFour: '4242',
    expMonth: '08',
    expYear: '29',
  });

  await user.click(screen.getByRole('button', { name: /agregar tarjeta/i }));
  await user.type(screen.getByPlaceholderText('4242 4242 4242 4242'), '4242424242424242');
  await user.type(screen.getByLabelText(/nombre en la tarjeta/i), 'Jane Doe');
  await user.type(screen.getByPlaceholderText('08'), '08');
  await user.type(screen.getByPlaceholderText('29'), '29');
  await user.type(screen.getByPlaceholderText('123'), '123');
  await user.click(screen.getByRole('button', { name: /guardar tarjeta/i }));

  await waitFor(() => expect(screen.getByText(/visa •••• 4242/i)).toBeInTheDocument());
}

describe('CheckoutPage', () => {
  beforeEach(() => {
    mockedPost.mockReset();
    mockedTokenizeCard.mockReset();
  });

  it('redirects to "/" when there is no selected product', () => {
    const store = configureStore({
      reducer: { product: productReducer, checkout: checkoutReducer, payment: paymentReducer },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/checkout']}>
          <Routes>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/" element={<div>product screen</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );
    expect(screen.getByText('product screen')).toBeInTheDocument();
  });

  it('blocks continuing until delivery form and card are both valid', async () => {
    const user = userEvent.setup();
    renderCheckout();

    await user.click(screen.getByRole('button', { name: /continuar/i }));

    expect(screen.getByText(/agrega una tarjeta/i)).toBeInTheDocument();
    expect(mockedPost).not.toHaveBeenCalled();
  });

  it('creates the customer and the transaction, then navigates to /summary', async () => {
    mockedPost.mockImplementation((url: string) => {
      if (url === '/customers') {
        return Promise.resolve({
          data: { id: 'cust_1', name: 'Jane Doe', email: 'jane@example.com', documentId: '1020304050', phone: '+573001234567' },
        });
      }
      if (url === '/transactions') {
        return Promise.resolve({
          data: {
            id: 'txn_1',
            reference: 'ref_1',
            productId: 'prod_1',
            customerId: 'cust_1',
            amount: 4730000,
            baseFee: 150000,
            deliveryFee: 80000,
            status: 'PENDING',
            // Real backend JSON field name — see paymentSlice's RawTransactionResponse.
            wompiTransactionId: null,
            createdAt: '2026-07-25T00:00:00.000Z',
            updatedAt: '2026-07-25T00:00:00.000Z',
          },
        });
      }
      return Promise.reject(new Error(`Unexpected POST ${url}`));
    });

    const user = userEvent.setup();
    const { store } = renderCheckout();

    await fillDeliveryForm(user);
    await addCard(user);
    await user.click(screen.getByRole('button', { name: /continuar/i }));

    await waitFor(() => expect(screen.getByText('summary screen')).toBeInTheDocument());
    expect(mockedPost).toHaveBeenCalledWith('/customers', {
      name: 'Jane Doe',
      email: 'jane@example.com',
      documentId: '1020304050',
      phone: '+573001234567',
    });
    expect(mockedPost).toHaveBeenCalledWith('/transactions', {
      productId: 'prod_1',
      customerId: 'cust_1',
    });
    expect(store.getState().payment.transactionId).toBe('txn_1');
  });
});
