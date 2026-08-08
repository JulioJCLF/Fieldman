import { useState } from 'react';

import { Alert, Button, formatCurrency, Modal, SegmentedControl } from '../../../components/ui';
import { PixPayment } from '../../payments/components/PixPayment';
import { ApiError, checkout } from '../api/tabsApi';
import type { GatewayPayment, PaymentMethod, TabWithRefills } from '../types';

interface Props {
  tab: TabWithRefills;
  onCheckedOut: (payment: GatewayPayment) => void;
  onClose: () => void;
}

export function CheckoutModal({ tab, onCheckedOut, onClose }: Props) {
  const [method, setMethod]   = useState<PaymentMethod>('PIX');
  const [pixMode, setPixMode] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openRefills  = tab.refills.filter((r) => r.payment_status === 'OPEN');
  const entryOwed    = tab.entry_status === 'PENDING' ? Number(tab.entry_fee) : 0;
  const refillsOwed  = openRefills.reduce((sum, r) => sum + Number(r.total_price), 0);
  const total        = entryOwed + refillsOwed;

  async function handleConfirm() {
    // PIX passa pelo gateway; Dinheiro/Cartão são confirmação manual imediata.
    if (method === 'PIX') {
      setPixMode(true);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const payment = await checkout(tab.id, { method });
      onCheckedOut(payment);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao fechar comanda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title={pixMode ? 'Pagamento PIX' : 'Fechar comanda'} onClose={onClose} closeDisabled={loading}>
      <div className="space-y-4">
        <p className="font-mono text-sm font-bold text-white">{tab.player_name}</p>

        {pixMode ? (
          <PixPayment
            tabId={tab.id}
            onApproved={() => onCheckedOut({} as GatewayPayment)}
            onCancel={() => setPixMode(false)}
          />
        ) : (
          <>
            {/* Resumo de pendências */}
            <div className="border border-[#34402f] bg-[#111711] font-mono text-xs">
              {entryOwed > 0 && (
                <div className="flex justify-between border-b border-[#34402f] px-4 py-3">
                  <span className="text-stone-400">Taxa de entrada ({tab.modality === 'EQUIPPED' ? 'Equipado' : 'Aluguel'})</span>
                  <span className="font-bold text-stone-200">{formatCurrency(entryOwed)}</span>
                </div>
              )}
              {openRefills.map((r) => (
                <div key={r.id} className="flex justify-between border-b border-[#34402f] px-4 py-3 last:border-0">
                  <span className="text-stone-400">{r.description} ×{r.quantity}</span>
                  <span className="font-bold text-stone-200">{formatCurrency(Number(r.total_price))}</span>
                </div>
              ))}
              <div className="flex justify-between bg-[#1a221a] px-4 py-3">
                <span className="font-bold uppercase tracking-[0.14em] text-lime-300">Total</span>
                <span className="text-xl font-bold text-lime-300">{formatCurrency(total)}</span>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">Forma de pagamento</p>
              <div className="mt-2">
                <SegmentedControl
                  value={method}
                  onChange={setMethod}
                  options={[
                    { value: 'PIX', label: 'PIX' },
                    { value: 'CARD', label: 'Cartão' },
                    { value: 'CASH', label: 'Dinheiro' },
                  ]}
                />
              </div>
              {method === 'PIX' && (
                <p className="mt-2 font-mono text-[10px] text-stone-500">
                  Um QR Code será gerado para o cliente pagar pelo celular.
                </p>
              )}
            </div>

            {error && <Alert>{error}</Alert>}

            <div className="flex justify-end gap-3 border-t border-[#2d382a] pt-4">
              <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? 'Confirmando…' : method === 'PIX' ? `Gerar PIX ${formatCurrency(total)}` : `Confirmar ${formatCurrency(total)}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
