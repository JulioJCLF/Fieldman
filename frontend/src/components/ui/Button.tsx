import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const BASE = 'inline-flex items-center justify-center rounded-lg border font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

const VARIANTS: Record<Variant, string> = {
  primary: 'border-primary bg-primary text-on-primary shadow-sm hover:opacity-90',
  secondary: 'border-outline-variant bg-surface-lowest text-on-surface-variant hover:border-outline hover:text-on-surface',
  danger: 'border-error/40 text-error hover:border-error hover:bg-error/10',
  ghost: 'border-transparent text-outline hover:bg-surface-container hover:text-on-surface-variant',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-xs',
};

export function Button({ variant = 'primary', size = 'md', block = false, className = '', type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}
