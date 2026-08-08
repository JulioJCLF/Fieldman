import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'warning' | 'info';

interface Props {
  tone?: Tone;
  children: ReactNode;
}

const TONES: Record<Tone, string> = {
  error:   'border-error bg-error/5 text-error',
  success: 'border-primary bg-primary/5 text-primary',
  warning: 'border-amber-400 bg-amber-400/5 text-amber-600',
  info:    'border-primary bg-primary/5 text-primary',
};

export function Alert({ tone = 'error', children }: Props) {
  return (
    <p className={`rounded-lg border-l-4 px-3 py-2 text-xs leading-5 ${TONES[tone]}`}>
      {children}
    </p>
  );
}
