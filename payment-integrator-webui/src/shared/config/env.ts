// Isolated so Jest can substitute this whole module (see jest.config.cjs
// moduleNameMapper) instead of trying to compile `import.meta.env`, which
// TypeScript only allows when targeting an ES module — Vite handles it
// natively, but ts-jest compiles to CommonJS for Jest.
export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  paymentProviderApiBaseUrl: import.meta.env.VITE_PAYMENT_PROVIDER_API_BASE_URL,
  paymentProviderPublicKey: import.meta.env.VITE_PAYMENT_PROVIDER_PUBLIC_KEY,
};
