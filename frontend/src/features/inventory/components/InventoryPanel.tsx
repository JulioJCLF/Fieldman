import { useEffect, useState } from 'react';

import { ApiError, listProducts } from '../api/inventoryApi';
import { CHANNEL_LABEL, type InventoryChannel, type Product } from '../types';
import { ProductForm } from './ProductForm';
import { ProductRow } from './ProductRow';
import { ReportsPanel } from './ReportsPanel';
import { SalePosForm } from './SalePosForm';

interface Props {
  channel: InventoryChannel;
}

type View = 'sale' | 'products' | 'reports';

const VIEW_LABELS: Record<View, string> = {
  sale:     'Venda',
  products: 'Produtos',
  reports:  'Relatórios',
};

export function InventoryPanel({ channel }: Props) {
  const [view, setView]           = useState<View>('sale');
  const [products, setProducts]   = useState<Product[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    listProducts(channel)
      .then((data) => { if (!cancelled) setProducts(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao carregar produtos.'); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [channel]);

  function handleCreated(product: Product) {
    setProducts((prev) => [...prev, product].sort((a, b) => a.name.localeCompare(b.name)));
    setShowForm(false);
  }

  function handleProductUpdated(product: Product) {
    setProducts((prev) => prev.map((p) => p.id === product.id ? product : p));
  }

  function handleSold(productId: string, soldQty: number) {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, stock_qty: p.stock_qty - soldQty } : p));
    setRefreshKey((k) => k + 1);
  }

  return (
    <section>
      <div className="border-b border-outline-variant pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {channel === 'SNACKBAR' ? 'Módulo 03 · lanchonete' : 'Módulo 04 · loja'}
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-on-surface sm:text-4xl">
          {CHANNEL_LABEL[channel]}.
        </h2>
      </div>

      {/* Navegação interna */}
      <div className="mt-6 flex gap-2">
        {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] transition ${
              view === v ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'
            }`}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading && <p className="text-xs text-outline">Carregando…</p>}
        {error && <p className="border-l-2 border-error bg-error/5 px-3 py-2 text-xs text-error">{error}</p>}

        {!loading && !error && view === 'sale' && (
          <SalePosForm channel={channel} products={products} onSold={handleSold} />
        )}

        {!loading && !error && view === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              {!showForm && (
                <button onClick={() => setShowForm(true)}
                  className="border border-primary px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-primary transition hover:bg-primary hover:text-on-primary">
                  + Novo produto
                </button>
              )}
            </div>

            {showForm && (
              <ProductForm channel={channel} onCreated={handleCreated} onCancel={() => setShowForm(false)} />
            )}

            {products.length === 0 ? (
              <div className="border border-dashed border-outline-variant px-5 py-6 text-center">
                <p className="text-xs text-outline">Nenhum produto cadastrado ainda.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {products.map((p) => (
                  <ProductRow key={p.id} channel={channel} product={p} onUpdated={handleProductUpdated} />
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && !error && view === 'reports' && (
          <ReportsPanel channel={channel} refreshKey={refreshKey} />
        )}
      </div>
    </section>
  );
}
