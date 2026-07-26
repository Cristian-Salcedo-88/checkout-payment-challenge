export interface AmountBreakdown {
  productAmount: number;
  baseFee: number;
  deliveryFee: number;
}

// All amounts are COP cents (matches the payment provider's amount_in_cents
// convention).
export function calculateTotal({ productAmount, baseFee, deliveryFee }: AmountBreakdown): number {
  return productAmount + baseFee + deliveryFee;
}
