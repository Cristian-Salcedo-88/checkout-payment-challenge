import axios from 'axios';

import { env } from '../config/env';

// Talks ONLY to our own NestJS backend (products, customers, transactions).
// Payment provider tokenization uses a separate client in features/payment —
// it must never go through this instance, since that call has to hit the
// payment provider directly from the browser with the public key, not
// through our API.
const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});

export default httpClient;
