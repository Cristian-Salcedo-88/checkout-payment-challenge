import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import CardModal from './CardModal';
import checkoutReducer from './checkoutSlice';
import { tokenizeCard } from '../payment/paymentProviderClient';

jest.mock('../payment/paymentProviderClient', () => ({
  tokenizeCard: jest.fn(),
}));

const mockedTokenizeCard = tokenizeCard as jest.MockedFunction<typeof tokenizeCard>;

function renderCardModal(onSuccess = jest.fn()) {
  const store = configureStore({ reducer: { checkout: checkoutReducer } });
  render(
    <Provider store={store}>
      <CardModal isOpen onClose={jest.fn()} onSuccess={onSuccess} />
    </Provider>,
  );
  return { store, onSuccess };
}

const VALID_VISA = '4242424242424242';

async function fillValidCard(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText('4242 4242 4242 4242'), VALID_VISA);
  await user.type(screen.getByLabelText(/nombre en la tarjeta/i), 'Jane Doe');
  await user.type(screen.getByPlaceholderText('08'), '08');
  await user.type(screen.getByPlaceholderText('29'), '29');
  await user.type(screen.getByPlaceholderText('123'), '123');
}

describe('CardModal', () => {
  beforeEach(() => {
    mockedTokenizeCard.mockReset();
  });

  it('shows the Visa logo as soon as the number matches its prefix', async () => {
    const user = userEvent.setup();
    renderCardModal();

    await user.type(screen.getByPlaceholderText('4242 4242 4242 4242'), '4242');
    expect(screen.getByRole('img', { name: 'Visa' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting incomplete data', async () => {
    const user = userEvent.setup();
    renderCardModal();

    await user.click(screen.getByRole('button', { name: /guardar tarjeta/i }));

    expect(screen.getByText(/número de tarjeta inválido/i)).toBeInTheDocument();
    expect(screen.getByText(/ingresa el nombre del titular/i)).toBeInTheDocument();
    expect(mockedTokenizeCard).not.toHaveBeenCalled();
  });

  it('tokenizes the card and stores the token on valid submit', async () => {
    mockedTokenizeCard.mockResolvedValue({
      id: 'tok_test_123',
      brand: 'VISA',
      lastFour: '4242',
      expMonth: '08',
      expYear: '29',
    });
    const user = userEvent.setup();
    const { store, onSuccess } = renderCardModal();

    await fillValidCard(user);
    await user.click(screen.getByRole('button', { name: /guardar tarjeta/i }));

    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(mockedTokenizeCard).toHaveBeenCalledWith({
      number: VALID_VISA,
      cvc: '123',
      expMonth: '08',
      expYear: '29',
      cardHolder: 'Jane Doe',
    });
    expect(store.getState().checkout.card).toEqual({
      token: 'tok_test_123',
      brand: 'visa',
      lastFour: '4242',
    });
  });

  it('shows an error message when tokenization fails', async () => {
    mockedTokenizeCard.mockRejectedValue(new Error('Tarjeta rechazada por el proveedor de pagos'));
    const user = userEvent.setup();
    renderCardModal();

    await fillValidCard(user);
    await user.click(screen.getByRole('button', { name: /guardar tarjeta/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Tarjeta rechazada por el proveedor de pagos');
  });
});
