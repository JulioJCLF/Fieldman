import { useState } from 'react';

import { ApiError, adjustStock } from '../api/inventoryApi';
import { formatCurrency } from '../format';
import type { InventoryChannel, Product } from '../types';

interface Props {
  channel: InventoryChannel;
  product: Product;
  onUpdated: (product: Product) => void;
}

export function ProductRow({ channel, product, onUpdated }: Props) {
  const [delta, setDelta]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const margin = product.sale_price - product.cost_price;
  const lowStock = product.stock_qty <= 5;

  async function applyDelta(sign: 1 | -1) {
    const amount = parseInt(delta || '1', 10);
    if (isNaN(amount) || amount <= 0) { setError('Quantidade inválida.'); return; }

    setError(null);
    setLoading(true);
    try {
      const updated = await adjustStock(channel, product.id, sign * amount);
      onUpdated(updated);
      setDelta('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao ajustar estoque.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-outline-variant bg-surface-lowest p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-on-surface">{product.name}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-outline">{product.category}</p>
        </div>
        <div className="shrink-0 text-right text-xs">
          <p className="text-on-surface-variant">{formatCurrency(product.sale_price)}</p>
          <p className="mt-0.5 text-outline">
            custo {formatCurrency(product.cost_price)} · marg {formatCurrency(margin)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-outline-variant pt-3">
        <span className={`text-xs font-bold ${lowStock ? 'text-amber-600' : 'text-primary'}`}>
          {product.stock_qty} un.
          {lowStock && <span className="ml-1 text-[10px] text-amber-500">baixo</span>}
        </span>

        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            placeholder="qtd"
            className="w-16 border border-outline-variant bg-surface-low px-2 py-1 text-xs text-on-surface placeholder-outline outline-none focus:border-primary/50"
          />
          <button type="button" onClick={() => applyDelta(1)} disabled={loading}
            className="border border-primary/50 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 disabled:opacity-40">
            + Entrada
          </button>
          <button type="button" onClick={() => applyDelta(-1)} disabled={loading}
            className="border border-error/50 px-2.5 py-1 text-xs font-bold text-error hover:bg-error/10 disabled:opacity-40">
            − Baixa
          </button>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
