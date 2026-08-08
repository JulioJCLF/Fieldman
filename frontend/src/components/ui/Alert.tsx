import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'warning' | 'info';

interface Props {
  tone?: Tone;
  children: ReactNode;
}

const TONES: Record<Tone, string> = {
  error:   'border-red-400 bg-red-400/5 text-red-300',
  success: 'border-lime-400 bg-lime-400/5 text-lime-300',
  warning: 'border-amber-400 bg-amber-400/5 text-amber-300',
  info:    'border-lime-300 bg-lime-300/5 text-lime-100',
};

export function Alert({ tone = 'error', children }: Props) {
  return (
    <p className={`border-l-2 px-3 py-2 font-mono text-xs leading-5 ${TONES[tone]}`}>
      {children}
    </p>
  );
}
