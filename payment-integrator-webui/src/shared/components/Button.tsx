import type { ButtonHTMLAttributes } from 'react';

import './Button.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
}

const Button = ({
  variant = 'primary',
  isLoading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) => {
  return (
    <button
      className={['btn', `btn-${variant}`, className].filter(Boolean).join(' ')}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? 'Cargando…' : children}
    </button>
  );
};

export default Button;
