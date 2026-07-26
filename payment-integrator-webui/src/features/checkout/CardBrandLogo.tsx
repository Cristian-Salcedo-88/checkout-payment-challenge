import type { CardBrand } from './cardValidation';

interface CardBrandLogoProps {
  brand: CardBrand;
}

// Simple inline SVGs — no external logo assets to fetch/hotlink, and they
// still read clearly at the small size this field renders them at.
const CardBrandLogo = ({ brand }: CardBrandLogoProps) => {
  if (brand === 'visa') {
    return (
      <svg viewBox="0 0 48 32" width="40" height="27" role="img" aria-label="Visa">
        <rect width="48" height="32" rx="4" fill="#1a1f71" />
        <text
          x="24"
          y="21"
          textAnchor="middle"
          fontSize="12"
          fontStyle="italic"
          fontWeight="bold"
          fill="#fff"
        >
          VISA
        </text>
      </svg>
    );
  }

  if (brand === 'mastercard') {
    return (
      <svg viewBox="0 0 48 32" width="40" height="27" role="img" aria-label="Mastercard">
        <rect width="48" height="32" rx="4" fill="#f5f5f5" />
        <circle cx="20" cy="16" r="9" fill="#eb001b" />
        <circle cx="28" cy="16" r="9" fill="#f79e1b" fillOpacity="0.85" />
      </svg>
    );
  }

  return null;
};

export default CardBrandLogo;
