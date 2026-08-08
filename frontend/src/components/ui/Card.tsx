import type { ReactNode } from 'react';

interface Props {
  title?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Painel bordado padrão do sistema. Cabeçalho opcional (título + ações). */
export function Card({ title, actions, className = '', children }: Props) {
  return (
    <div className={`rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-panel sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-outline-variant pb-4">
          {title && <p className="text-xs font-bold text-primary">{title}</p>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
