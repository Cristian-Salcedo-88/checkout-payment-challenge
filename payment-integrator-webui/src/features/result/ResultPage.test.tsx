import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import checkoutReducer from '../checkout/checkoutSlice';
import paymentReducer from '../payment/paymentSlice';
import type { PaymentState } from '../payment/paymentSlice';
import ResultPage from './ResultPage';

const basePayment: PaymentState = {
  transactionId: 'txn_1',
  reference: 'ref_1',
  backendStatus: 'APPROVED',
  phase: 'done',
  amount: 4730000,
  baseFee: 150000,
  deliveryFee: 80000,
  errorMessage: null,
};

function renderResult(payment: PaymentState) {
  const store = configureStore({
    reducer: { checkout: checkoutReducer, payment: paymentReducer },
    preloadedState: { payment },
  });

  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/result']}>
        <Routes>
          <Route path="/result" element={<ResultPage />} />
          <Route path="/" element={<div>product screen</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

  return { store };
}

describe('ResultPage', () => {
  it('shows a success message and the amount/reference for an approved payment', () => {
    renderResult(basePayment);

    expect(screen.getByText(/pago aprobado/i)).toBeInTheDocument();
    expect(screen.getByText('ref_1')).toBeInTheDocument();
    expect(screen.getByText(/47[.,]300/)).toBeInTheDocument();
  });

  it('shows a decline message for a declined payment', () => {
    renderResult({ ...basePayment, backendStatus: 'DECLINED' });
    expect(screen.getByText(/no se pudo completar/i)).toBeInTheDocument();
    expect(screen.getByText(/rechazó el pago/i)).toBeInTheDocument();
  });

  it('shows a generic error message for a gateway error', () => {
    renderResult({ ...basePayment, backendStatus: 'ERROR' });
    expect(screen.getByText(/ocurrió un error/i)).toBeInTheDocument();
  });

  it('redirects to "/" when there is no resolved transaction', () => {
    renderResult({ ...basePayment, phase: 'idle', backendStatus: null });
    expect(screen.getByText('product screen')).toBeInTheDocument();
  });

  it('resets checkout/payment state and navigates back to the product on click', async () => {
    const user = userEvent.setup();
    const { store } = renderResult(basePayment);

    await user.click(screen.getByRole('button', { name: /volver al producto/i }));

    expect(screen.getByText('product screen')).toBeInTheDocument();
    expect(store.getState().payment.transactionId).toBeNull();
  });
});
