import { useState } from 'react';

import { ApiError, recordSale } from '../api/inventoryApi';
import { formatCurrency } from '../format';
import type { InventoryChannel, Product } from '../types';

interface Props {
  channel: InventoryChannel;
  products: Product[];
  onSold: (updatedProductId: string, soldQty: number) => void;
}

/** Ponto de venda simplificado: seleciona produto, quantidade e registra venda direta. */
export function SalePosForm({ channel, products, onSold }: Props) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity]   = useState('1');
  const [error, setError]         = useState<string | null>(null);
  const [feedback, setFeedback]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const available = products.filter((p) => p.active && p.stock_qty > 0);
  const selected  = products.find((p) => p.id === productId) ?? null;
  const qty       = parseInt(quantity, 10);
  const total     = selected && !isNaN(qty) ? selected.sale_price * qty : 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (!selected) { setError('Selecione um produto.'); return; }
    if (isNaN(qty) || qty < 1) { setError('Informe uma quantidade válida.'); return; }
    if (qty > selected.stock_qty) { setError(`Estoque insuficiente (disponível: ${selected.stock_qty}).`); return; }

    setLoading(true);
    try {
      await recordSale(channel, { product_id: selected.id, quantity: qty });
      onSold(selected.id, qty);
      setFeedback(`Venda registrada: ${qty}× ${selected.name} · ${formatCurrency(total)}`);
      setProductId('');
      setQuantity('1');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao registrar venda.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'mt-2 w-full border border-outline-variant bg-surface-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/50';
  const labelClass = 'block text-[10px] uppercase tracking-[0.14em] text-outline';

  return (
    <form onSubmit={handleSubmit} className="border border-outline-variant bg-surface-lowest p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
        Registrar venda
      </p>

      {available.length === 0 ? (
        <p className="mt-4 text-xs text-outline">
          Nenhum produto disponível em estoque. Cadastre produtos e reponha o estoque.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="sale-product" className={labelClass}>Produto</label>
            <select id="sale-product" value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
              <option value="">Selecione…</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.sale_price)} ({p.stock_qty} un.)
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label htmlFor="sale-qty" className={labelClass}>Quantidade</label>
              <input id="sale-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
            </div>
            <div className="border border-outline-variant bg-surface-low px-4 py-2.5 text-right">
              <p className="text-[10px] uppercase tracking-[0.12em] text-outline">Total</p>
              <p className="mt-0.5 text-lg font-bold text-primary">{formatCurrency(total)}</p>
            </div>
          </div>

          {error && <p className="border-l-2 border-error bg-error/5 px-3 py-2 text-xs text-error">{error}</p>}
          {feedback && <p className="border-l-2 border-primary bg-primary/5 px-3 py-2 text-xs text-primary">{feedback}</p>}

          <div className="flex justify-end border-t border-outline-variant pt-4">
            <button type="submit" disabled={loading}
              className="border border-primary bg-primary px-5 py-2 text-xs font-bold uppercase tracking-[0.14em] text-on-primary hover:bg-primary disabled:opacity-40">
              {loading ? 'Registrando…' : 'Confirmar venda'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
