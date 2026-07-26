import {
  detectCardBrand,
  isCvvValid,
  isExpiryValid,
  luhnCheck,
  validateCardNumber,
} from './cardValidation';

describe('luhnCheck', () => {
  it('accepts well-known valid test card numbers', () => {
    expect(luhnCheck('4242424242424242')).toBe(true);
    expect(luhnCheck('4111111111111111')).toBe(true);
    expect(luhnCheck('5555555555554444')).toBe(true);
    expect(luhnCheck('2223003122003222')).toBe(true);
  });

  it('accepts numbers with spaces/dashes as formatting', () => {
    expect(luhnCheck('4242 4242 4242 4242')).toBe(true);
    expect(luhnCheck('4242-4242-4242-4242')).toBe(true);
  });

  it('rejects a number with a tampered last digit', () => {
    expect(luhnCheck('4242424242424241')).toBe(false);
  });

  it('rejects short/empty input', () => {
    expect(luhnCheck('4242')).toBe(false);
    expect(luhnCheck('')).toBe(false);
  });
});

describe('detectCardBrand', () => {
  it('detects visa for numbers starting with 4', () => {
    expect(detectCardBrand('4242424242424242')).toBe('visa');
    expect(detectCardBrand('4')).toBe('visa');
  });

  it('detects mastercard for the 51-55 prefix range', () => {
    expect(detectCardBrand('5100000000000000')).toBe('mastercard');
    expect(detectCardBrand('5555555555554444')).toBe('mastercard');
    expect(detectCardBrand('5600000000000000')).toBe('unknown');
    expect(detectCardBrand('5000000000000000')).toBe('unknown');
  });

  it('detects mastercard for the 2221-2720 prefix range', () => {
    expect(detectCardBrand('2221000000000000')).toBe('mastercard');
    expect(detectCardBrand('2720000000000000')).toBe('mastercard');
    expect(detectCardBrand('2220999999999999')).toBe('unknown');
    expect(detectCardBrand('2721000000000000')).toBe('unknown');
  });

  it('stays unknown while the 2-series prefix is still ambiguous', () => {
    expect(detectCardBrand('22')).toBe('unknown');
    expect(detectCardBrand('222')).toBe('unknown');
  });

  it('returns unknown for empty input', () => {
    expect(detectCardBrand('')).toBe('unknown');
  });
});

describe('validateCardNumber', () => {
  it('validates a real visa test number', () => {
    expect(validateCardNumber('4242424242424242')).toEqual({ valid: true, brand: 'visa' });
  });

  it('validates a real mastercard test number', () => {
    expect(validateCardNumber('5555555555554444')).toEqual({ valid: true, brand: 'mastercard' });
  });

  it('rejects a luhn-invalid number even if the brand prefix matches', () => {
    expect(validateCardNumber('4242424242424241')).toEqual({ valid: false, brand: 'visa' });
  });

  it('rejects a brand it does not support', () => {
    // Amex-style prefix (34xx) — out of scope for this app.
    expect(validateCardNumber('340000000000009').valid).toBe(false);
  });
});

describe('isCvvValid', () => {
  it('accepts 3 digits for visa and mastercard', () => {
    expect(isCvvValid('123', 'visa')).toBe(true);
    expect(isCvvValid('123', 'mastercard')).toBe(true);
  });

  it('rejects wrong lengths', () => {
    expect(isCvvValid('12', 'visa')).toBe(false);
    expect(isCvvValid('1234', 'visa')).toBe(false);
  });

  it('rejects non-digit characters', () => {
    expect(isCvvValid('12a', 'visa')).toBe(false);
  });
});

describe('isExpiryValid', () => {
  const referenceDate = new Date(2026, 6, 15); // July 15, 2026

  it('accepts the current month/year', () => {
    expect(isExpiryValid('07', '26', referenceDate)).toBe(true);
  });

  it('accepts a future month/year', () => {
    expect(isExpiryValid('08', '26', referenceDate)).toBe(true);
    expect(isExpiryValid('01', '27', referenceDate)).toBe(true);
  });

  it('rejects a past month in the current year', () => {
    expect(isExpiryValid('06', '26', referenceDate)).toBe(false);
  });

  it('rejects a past year', () => {
    expect(isExpiryValid('12', '25', referenceDate)).toBe(false);
  });

  it('rejects an invalid month', () => {
    expect(isExpiryValid('00', '26', referenceDate)).toBe(false);
    expect(isExpiryValid('13', '26', referenceDate)).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isExpiryValid('7', '6', referenceDate)).toBe(false);
    expect(isExpiryValid('', '', referenceDate)).toBe(false);
  });
});
