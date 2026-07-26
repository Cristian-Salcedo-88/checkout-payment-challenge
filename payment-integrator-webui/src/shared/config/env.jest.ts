// Jest stand-in for env.ts (see moduleNameMapper in jest.config.cjs). Values
// don't need to be real — no test exercises a live network call through
// these clients, they only need to construct without throwing.
export const env = {
  apiBaseUrl: 'http://localhost:3000',
  paymentProviderApiBaseUrl: 'https://sandbox.payment-provider.example/v1',
  paymentProviderPublicKey: 'pub_test_stub',
};
