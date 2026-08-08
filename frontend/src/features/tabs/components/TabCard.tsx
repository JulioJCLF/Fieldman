import { useState } from 'react';

import { ApiError, markRefillPaid } from '../api/tabsApi';
import type { Refill, TabWithRefills } from '../types';
import { CheckoutModal } from './CheckoutModal';
import { RefillModal } from './RefillModal';

interface Props {
  tab: TabWithRefills;
  onUpdated: (updated: TabWithRefills) => void;
}

const MODALITY_BADGE: Record<string, string> = {
  EQUIPPED: 'EQ',
  RENTAL:   'AL',
};

const ITEM_TYPE_SHORT: Record<string, string> = {
  REFILL:   'Recarga',
  SNACKBAR: 'Lanches',
  STORE:    'Loja',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function TabCard({ tab, onUpdated }: Props) {
  const [expanded, setExpanded]             = useState(false);
  const [showRefill, setShowRefill]         = useState(false);
  const [showCheckout, setShowCheckout]     = useState(false);
  const [payingRefill, setPayingRefill]     = useState<string | null>(null);
  const [refillPayError, setRefillPayError] = useState<string | null>(null);

  const openRefills   = tab.refills.filter((r) => r.payment_status === 'OPEN');
  const entryOwed     = tab.entry_status === 'PENDING' ? Number(tab.entry_fee) : 0;
  const refillsOwed   = openRefills.reduce((sum, r) => sum + Number(r.total_price), 0);
  const totalPending  = entryOwed + refillsOwed;
  const isPaidOff     = totalPending <= 0;

  function applyRefill(refill: Refill): TabWithRefills {
    return { ...tab, refills: [...tab.refills, refill] };
  }

  function applyRefillPaid(refillId: string): TabWithRefills {
    return {
      ...tab,
      refills: tab.refills.map((r) => r.id === refillId ? { ...r, payment_status: 'PAID' as const } : r),
    };
  }

  function applyCheckout(): TabWithRefills {
    return {
      ...tab,
      entry_status: 'PAID' as const,
      refills: tab.refills.map((r) => ({ ...r, payment_status: 'PAID' as const })),
    };
  }

  async function handleMarkRefillPaid(refill: Refill) {
    setRefillPayError(null);
    setPayingRefill(refill.id);
    try {
      await markRefillPaid(tab.id, refill.id);
      onUpdated(applyRefillPaid(refill.id));
    } catch (err) {
      setRefillPayError(err instanceof ApiError ? err.message : 'Erro ao marcar recarga como paga.');
    } finally {
      setPayingRefill(null);
    }
  }

  return (
    <>
      <div className={`border bg-[#0d120d] ${isPaidOff ? 'border-[#2d382a]' : 'border-[#384534]'}`}>
        {/* Cabeçalho do card */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[#111711]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={`shrink-0 border px-1.5 py-0.5 font-mono text-[10px] font-bold ${
              tab.modality === 'EQUIPPED'
                ? 'border-sky-400/40 text-sky-400'
                : 'border-amber-400/40 text-amber-400'
            }`}>
              {MODALITY_BADGE[tab.modality]}
            </span>
            <span className="truncate text-sm font-bold text-stone-200">{tab.player_name}</span>
            {tab.guest_name && (
              <span className="shrink-0 font-mono text-[10px] text-stone-500">avulso</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3 font-mono text-xs">
            {!isPaidOff && (
              <span className="text-amber-300">{formatCurrency(totalPending)} pendente</span>
            )}
            {isPaidOff && (
              <span className="text-lime-400">Pago</span>
            )}
            <span className="text-stone-600">{expanded ? '▲' : '▼'}</span>
          </div>
        </button>

        {/* Detalhes expandidos */}
        {expanded && (
          <div className="border-t border-[#2d382a] px-4 pb-4 pt-3 space-y-3">
            {/* Taxa de entrada */}
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-stone-500">Taxa de entrada</span>
              <div className="flex items-center gap-2">
                <span className="text-stone-300">{formatCurrency(Number(tab.entry_fee))}</span>
                <span className={`border px-1.5 py-0.5 text-[10px] ${
                  tab.entry_status === 'PAID'
                    ? 'border-lime-400/30 text-lime-400'
                    : 'border-amber-400/30 text-amber-400'
                }`}>
                  {tab.entry_status === 'PAID' ? 'Pago' : 'Pendente'}
                </span>
              </div>
            </div>

            {/* Recargas */}
            {tab.refills.length > 0 && (
              <div className="space-y-1.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-600">Recargas / Itens</p>
                {tab.refills.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2 font-mono text-xs">
                    <span className="text-stone-400">
                      <span className="text-stone-600">{ITEM_TYPE_SHORT[r.item_type]} · </span>
                      {r.description} ×{r.quantity}
                    </span>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-stone-300">{formatCurrency(Number(r.total_price))}</span>
                      {r.payment_status === 'OPEN' ? (
                        <button
                          type="button"
                          onClick={() => handleMarkRefillPaid(r)}
                          disabled={payingRefill === r.id}
                          className="border border-amber-400/40 px-2 py-0.5 text-[10px] text-amber-400 hover:bg-amber-400/10 disabled:opacity-40"
                        >
                          {payingRefill === r.id ? '…' : 'Pagar'}
                        </button>
                      ) : (
                        <span className="border border-lime-400/30 px-2 py-0.5 text-[10px] text-lime-400">Pago</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {refillPayError && (
              <p className="font-mono text-xs text-red-400">{refillPayError}</p>
            )}

            {/* Ações */}
            <div className="flex gap-2 border-t border-[#2d382a] pt-3">
              <button
                type="button"
                onClick={() => setShowRefill(true)}
                className="border border-[#384534] px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-stone-400 hover:border-stone-500 hover:text-stone-200"
              >
                + Recarga
              </button>
              {!isPaidOff && (
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="border border-lime-300/60 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.12em] text-lime-300 hover:border-lime-300 hover:bg-lime-300/10"
                >
                  Fechar comanda · {formatCurrency(totalPending)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showRefill && (
        <RefillModal
          tabId={tab.id}
          onAdded={(refill) => { onUpdated(applyRefill(refill)); setShowRefill(false); }}
          onClose={() => setShowRefill(false)}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          tab={tab}
          onCheckedOut={() => { onUpdated(applyCheckout()); setShowCheckout(false); }}
          onClose={() => setShowCheckout(false)}
        />
      )}
    </>
  );
}
