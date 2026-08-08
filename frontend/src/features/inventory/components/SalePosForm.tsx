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

  const inputClass = 'mt-2 w-full border border-[#384534] bg-[#111711] px-3 py-2 text-sm text-stone-200 outline-none focus:border-lime-300/50';
  const labelClass = 'block font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500';

  return (
    <form onSubmit={handleSubmit} className="border border-[#384534] bg-[#0d120d] p-5 sm:p-6">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">
        Registrar venda
      </p>

      {available.length === 0 ? (
        <p className="mt-4 font-mono text-xs text-stone-500">
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
            <div className="border border-[#34402f] bg-[#111711] px-4 py-2.5 text-right">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">Total</p>
              <p className="mt-0.5 font-mono text-lg font-bold text-lime-300">{formatCurrency(total)}</p>
            </div>
          </div>

          {error && <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>}
          {feedback && <p className="border-l-2 border-lime-400 bg-lime-400/5 px-3 py-2 font-mono text-xs text-lime-300">{feedback}</p>}

          <div className="flex justify-end border-t border-[#2d382a] pt-4">
            <button type="submit" disabled={loading}
              className="border border-lime-300 bg-lime-300 px-5 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#080b08] hover:bg-lime-200 disabled:opacity-40">
              {loading ? 'Registrando…' : 'Confirmar venda'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
