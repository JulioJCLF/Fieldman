import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  tone?: Tone;
  children: ReactNode;
}

const TONES: Record<Tone, string> = {
  neutral: 'border-outline-variant bg-surface-container text-on-surface-variant',
  success: 'border-primary/30 bg-primary/10 text-primary',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700',
  danger:  'border-error/30 bg-error/10 text-error',
  info:    'border-sky-500/30 bg-sky-500/10 text-sky-700',
};

export function Badge({ tone = 'neutral', children }: Props) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${TONES[tone]}`}>
      {children}
    </span>
  );
}
