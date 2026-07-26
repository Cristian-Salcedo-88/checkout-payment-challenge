const formatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// Backend amounts (product price, fees, transaction totals) are all COP
// cents, matching the payment provider's own amount_in_cents convention.
export function formatCents(cents: number): string {
  return formatter.format(cents / 100);
}
