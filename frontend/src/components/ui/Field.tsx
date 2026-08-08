import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

const LABEL = 'block text-[10px] uppercase tracking-[0.14em] text-outline';

export function Field({ label, htmlFor, hint, error, children }: Props) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
        {hint && <span className="ml-1 text-outline">{hint}</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
