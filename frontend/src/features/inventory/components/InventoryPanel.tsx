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
      <div className="border-b border-[#293226] pb-6">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-lime-300">
          {channel === 'SNACKBAR' ? 'Módulo 03 · lanchonete' : 'Módulo 04 · loja'}
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
          {CHANNEL_LABEL[channel]}.
        </h2>
      </div>

      {/* Navegação interna */}
      <div className="mt-6 flex gap-2">
        {(Object.keys(VIEW_LABELS) as View[]).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)}
            className={`border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] transition ${
              view === v ? 'border-lime-300 bg-lime-300/10 text-lime-300' : 'border-[#384534] text-stone-400 hover:border-stone-500'
            }`}>
            {VIEW_LABELS[v]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {loading && <p className="font-mono text-xs text-stone-500">Carregando…</p>}
        {error && <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>}

        {!loading && !error && view === 'sale' && (
          <SalePosForm channel={channel} products={products} onSold={handleSold} />
        )}

        {!loading && !error && view === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              {!showForm && (
                <button onClick={() => setShowForm(true)}
                  className="border border-lime-300 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-lime-200 transition hover:bg-lime-300 hover:text-[#080b08]">
                  + Novo produto
                </button>
              )}
            </div>

            {showForm && (
              <ProductForm channel={channel} onCreated={handleCreated} onCancel={() => setShowForm(false)} />
            )}

            {products.length === 0 ? (
              <div className="border border-dashed border-[#384534] px-5 py-6 text-center">
                <p className="font-mono text-xs text-stone-500">Nenhum produto cadastrado ainda.</p>
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
