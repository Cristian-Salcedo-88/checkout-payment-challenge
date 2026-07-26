import { buildIntegritySignature } from './integrity-signature';

// Fixture taken verbatim from the payment gateway's own public docs worked
// example — not related to this project's real sandbox credentials. Used
// only to verify our SHA-256 concatenation matches the documented algorithm.
const DOCS_EXAMPLE_INTEGRITY_SECRET = 'prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6';
const DOCS_EXAMPLE_SIGNATURE = '37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5';

describe('buildIntegritySignature', () => {
  it('matches the worked example from the payment gateway docs', () => {
    const signature = buildIntegritySignature({
      reference: 'sk8-438k4-xmxm392-sn2m',
      amountInCents: 2490000,
      currency: 'COP',
      integritySecret: DOCS_EXAMPLE_INTEGRITY_SECRET,
    });

    expect(signature).toBe(DOCS_EXAMPLE_SIGNATURE);
  });

  it('produces a different signature when the amount changes', () => {
    const base = {
      reference: 'sk8-438k4-xmxm392-sn2m',
      currency: 'COP',
      integritySecret: DOCS_EXAMPLE_INTEGRITY_SECRET,
    };

    const signatureA = buildIntegritySignature({ ...base, amountInCents: 2490000 });
    const signatureB = buildIntegritySignature({ ...base, amountInCents: 2490001 });

    expect(signatureA).not.toBe(signatureB);
  });
});
