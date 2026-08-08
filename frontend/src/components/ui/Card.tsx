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
    <div className={`border border-[#384534] bg-[#0d120d] p-5 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-4 border-b border-[#2d382a] pb-4">
          {title && <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">{title}</p>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
