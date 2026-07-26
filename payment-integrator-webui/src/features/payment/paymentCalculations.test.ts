import { calculateTotal } from './paymentCalculations';

describe('calculateTotal', () => {
  it('adds the product amount, base fee and delivery fee', () => {
    expect(calculateTotal({ productAmount: 4500000, baseFee: 150000, deliveryFee: 80000 })).toBe(
      4730000,
    );
  });

  it('handles zero fees', () => {
    expect(calculateTotal({ productAmount: 100, baseFee: 0, deliveryFee: 0 })).toBe(100);
  });

  it('handles all-zero input', () => {
    expect(calculateTotal({ productAmount: 0, baseFee: 0, deliveryFee: 0 })).toBe(0);
  });
});
