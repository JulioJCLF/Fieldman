import type { ReactNode } from 'react';

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  tone?: Tone;
  children: ReactNode;
}

const TONES: Record<Tone, string> = {
  neutral: 'border-[#3d4839] text-stone-400',
  success: 'border-lime-400/40 text-lime-400',
  warning: 'border-amber-400/40 text-amber-400',
  danger:  'border-red-400/40 text-red-400',
  info:    'border-sky-400/40 text-sky-400',
};

export function Badge({ tone = 'neutral', children }: Props) {
  return (
    <span className={`inline-block border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${TONES[tone]}`}>
      {children}
    </span>
  );
}
