import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import App from './App';
import { store } from './app/store';

// Never resolves — keeps ProductPage in its loading state so this smoke
// test stays hermetic (no real network call) and deterministic.
jest.mock('./shared/api/httpClient', () => ({
  __esModule: true,
  default: { get: jest.fn(() => new Promise(() => {})) },
}));

// Smoke test: confirms the store + router wiring works end to end. Real
// per-screen tests live alongside each feature.
test('renders the product screen at the root route', () => {
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </Provider>,
  );

  expect(screen.getByText(/cargando producto/i)).toBeInTheDocument();
});
