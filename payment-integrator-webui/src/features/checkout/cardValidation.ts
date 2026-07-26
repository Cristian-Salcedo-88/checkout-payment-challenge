export type CardBrand = 'visa' | 'mastercard' | 'unknown';

export function luhnCheck(cardNumber: string): boolean {
  const digitsOnly = cardNumber.replace(/\D/g, '');
  if (digitsOnly.length < 12) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = Number(digitsOnly[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function detectCardBrand(cardNumber: string): CardBrand {
  const digitsOnly = cardNumber.replace(/\D/g, '');
  if (digitsOnly.length === 0) return 'unknown';

  if (digitsOnly.startsWith('4')) return 'visa';

  const prefix2 = Number(digitsOnly.slice(0, 2));
  if (prefix2 >= 51 && prefix2 <= 55) return 'mastercard';

  if (digitsOnly.length >= 4) {
    const prefix4 = Number(digitsOnly.slice(0, 4));
    if (prefix4 >= 2221 && prefix4 <= 2720) return 'mastercard';
  }

  return 'unknown';
}

export interface CardNumberValidation {
  valid: boolean;
  brand: CardBrand;
}

export function validateCardNumber(cardNumber: string): CardNumberValidation {
  const digitsOnly = cardNumber.replace(/\D/g, '');
  const brand = detectCardBrand(digitsOnly);
  const validLength = digitsOnly.length >= 13 && digitsOnly.length <= 19;

  return {
    valid: validLength && brand !== 'unknown' && luhnCheck(digitsOnly),
    brand,
  };
}

// Visa and Mastercard (the only brands this app accepts) both use a 3-digit
// CVV. Keyed by brand so a future brand with a different length (e.g. Amex's
// 4-digit CID) only needs an entry here, not a call-site change.
const CVV_LENGTH_BY_BRAND: Record<CardBrand, number> = {
  visa: 3,
  mastercard: 3,
  unknown: 3,
};

export function isCvvValid(cvv: string, brand: CardBrand): boolean {
  const expectedLength = CVV_LENGTH_BY_BRAND[brand];
  return new RegExp(`^\\d{${expectedLength}}$`).test(cvv);
}

// month: "MM", year: "YY" — the same format the payment provider's
// tokenization API expects, so the card form can pass these straight
// through without reformatting.
export function isExpiryValid(month: string, year: string, referenceDate: Date = new Date()): boolean {
  if (!/^\d{1,2}$/.test(month) || !/^\d{2}$/.test(year)) return false;

  const monthNum = Number(month);
  if (monthNum < 1 || monthNum > 12) return false;

  const fullYear = 2000 + Number(year);
  // A card is valid through the last instant of its expiration month.
  const expiresAt = new Date(fullYear, monthNum, 0, 23, 59, 59, 999);
  return expiresAt.getTime() >= referenceDate.getTime();
}
