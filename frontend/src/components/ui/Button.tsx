import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const BASE = 'inline-flex items-center justify-center border font-mono font-bold uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-40';

const VARIANTS: Record<Variant, string> = {
  primary:   'border-lime-300 bg-lime-300 text-[#080b08] hover:bg-lime-200',
  secondary: 'border-[#384534] text-stone-400 hover:border-stone-500 hover:text-stone-200',
  danger:    'border-red-400/50 text-red-400 hover:border-red-400 hover:bg-red-400/10',
  ghost:     'border-transparent text-stone-500 hover:text-stone-300',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2 text-xs',
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
