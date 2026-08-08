import type { ReactNode } from 'react';

interface Props {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}

const LABEL = 'block font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500';

export function Field({ label, htmlFor, hint, error, children }: Props) {
  return (
    <div>
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
        {hint && <span className="ml-1 text-stone-600">{hint}</span>}
      </label>
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1.5 font-mono text-xs text-red-400">{error}</p>}
    </div>
  );
}
