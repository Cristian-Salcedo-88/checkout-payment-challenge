import { createHash } from 'node:crypto';

export interface IntegritySignatureInput {
  reference: string;
  amountInCents: number;
  currency: string;
  integritySecret: string;
}

export function buildIntegritySignature(input: IntegritySignatureInput): string {
  const raw = `${input.reference}${input.amountInCents}${input.currency}${input.integritySecret}`;
  return createHash('sha256').update(raw).digest('hex');
}
