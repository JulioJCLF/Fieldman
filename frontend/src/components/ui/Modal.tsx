import type { ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  closeDisabled?: boolean;
  children: ReactNode;
}

export function Modal({ title, onClose, closeDisabled = false, children }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest shadow-panel-lg">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <p className="text-xs font-bold text-primary">{title}</p>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Fechar"
            className="text-xs text-outline transition hover:text-on-surface-variant disabled:opacity-40"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
