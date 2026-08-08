import { useState } from 'react';

import { Alert, Button, Field, Modal, SegmentedControl, TextInput } from '../../../components/ui';
import { ApiError, addRefill } from '../api/tabsApi';
import type { ItemType, PaymentStatus, Refill } from '../types';

interface Props {
  tabId: string;
  onAdded: (refill: Refill) => void;
  onClose: () => void;
}

export function RefillModal({ tabId, onAdded, onClose }: Props) {
  const [itemType, setItemType] = useState<ItemType>('REFILL');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [totalPrice, setTotalPrice] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('OPEN');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const qty = parseInt(quantity, 10);
    const price = parseFloat(totalPrice.replace(',', '.'));

    if (!description.trim()) { setError('Informe a descrição do item.'); return; }
    if (isNaN(qty) || qty < 1) { setError('Informe uma quantidade válida.'); return; }
    if (isNaN(price) || price < 0) { setError('Informe um preço válido.'); return; }

    setLoading(true);
    try {
      const refill = await addRefill(tabId, {
        item_type: itemType,
        description: description.trim(),
        quantity: qty,
        total_price: price,
        payment_status: paymentStatus,
      });
      onAdded(refill);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao lançar recarga.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal title="Lançar recarga / item" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Tipo">
          <SegmentedControl
            value={itemType}
            onChange={setItemType}
            options={[
              { value: 'REFILL', label: 'Recarga de aluguel' },
              { value: 'SNACKBAR', label: 'Lanchonete' },
              { value: 'STORE', label: 'Loja' },
            ]}
          />
        </Field>

        <Field label="Descrição" htmlFor="refill-desc">
          <TextInput id="refill-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: 600 BBs 0.25g" />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Quantidade" htmlFor="refill-qty">
            <TextInput id="refill-qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </Field>
          <Field label="Total (R$)" htmlFor="refill-price">
            <TextInput id="refill-price" inputMode="decimal" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} placeholder="0,00" />
          </Field>
        </div>

        <Field label="Pagamento">
          <SegmentedControl
            value={paymentStatus}
            onChange={setPaymentStatus}
            options={[
              { value: 'OPEN', label: 'Deixar em aberto' },
              { value: 'PAID', label: 'Pagar agora' },
            ]}
          />
        </Field>

        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Lançando…' : 'Confirmar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
