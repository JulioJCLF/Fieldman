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
      <div className="w-full max-w-md border border-[#384534] bg-[#0d120d]">
        <div className="flex items-center justify-between border-b border-[#2d382a] px-5 py-4">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">{title}</p>
          <button
            type="button"
            onClick={onClose}
            disabled={closeDisabled}
            aria-label="Fechar"
            className="font-mono text-xs text-stone-500 transition hover:text-stone-300 disabled:opacity-40"
          >
            ✕
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
