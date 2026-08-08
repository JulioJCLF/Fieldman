import { useState } from 'react';

import { Alert, Button, Card, Field, TextInput } from '../../../components/ui';
import { ApiError, createProduct } from '../api/inventoryApi';
import { parseDecimal } from '../format';
import type { InventoryChannel, Product } from '../types';

interface Props {
  channel: InventoryChannel;
  onCreated: (product: Product) => void;
  onCancel: () => void;
}

export function ProductForm({ channel, onCreated, onCancel }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQty, setStockQty] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const cost = parseDecimal(costPrice);
    const sale = parseDecimal(salePrice);
    const stock = parseInt(stockQty, 10);

    if (!name.trim()) { setError('Informe o nome do produto.'); return; }
    if (isNaN(cost) || cost < 0) { setError('Informe um custo válido.'); return; }
    if (isNaN(sale) || sale < 0) { setError('Informe um preço de venda válido.'); return; }
    if (isNaN(stock) || stock < 0) { setError('Informe um estoque válido.'); return; }

    setLoading(true);
    try {
      const product = await createProduct(channel, {
        name: name.trim(),
        category: category.trim() || 'Geral',
        cost_price: cost,
        sale_price: sale,
        stock_qty: stock,
      });
      onCreated(product);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao cadastrar produto.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="Cadastrar produto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome" htmlFor="prod-name">
            <TextInput id="prod-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Refrigerante lata" />
          </Field>
          <Field label="Categoria" htmlFor="prod-cat">
            <TextInput id="prod-cat" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Bebidas" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Custo (R$)" htmlFor="prod-cost">
            <TextInput id="prod-cost" inputMode="decimal" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Venda (R$)" htmlFor="prod-sale">
            <TextInput id="prod-sale" inputMode="decimal" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0,00" />
          </Field>
          <Field label="Estoque inicial" htmlFor="prod-stock">
            <TextInput id="prod-stock" type="number" min="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} />
          </Field>
        </div>

        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Cadastrar'}</Button>
        </div>
      </form>
    </Card>
  );
}
