import { useEffect, useRef, useState } from 'react';

import { ApiError, createPix, getPaymentStatus } from '../api/paymentsApi';
import type { PixCharge } from '../types';

interface Props {
  tabId: string;
  onApproved: () => void;
  onCancel: () => void;
}

const POLL_INTERVAL_MS = 3000;

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function PixPayment({ tabId, onApproved, onCancel }: Props) {
  const [charge, setCharge]   = useState<PixCharge | null>(null);
  const [status, setStatus]   = useState<'creating' | 'waiting' | 'approved' | 'rejected'>('creating');
  const [error, setError]     = useState<string | null>(null);
  const [copied, setCopied]   = useState(false);
  const approvedRef           = useRef(false);

  // Cria a cobrança PIX ao montar.
  useEffect(() => {
    let cancelled = false;
    createPix(tabId)
      .then((c) => {
        if (cancelled) return;
        setCharge(c);
        setStatus(c.status === 'APPROVED' ? 'approved' : 'waiting');
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'Erro ao gerar PIX.');
      });
    return () => { cancelled = true; };
  }, [tabId]);

  // Faz polling do status enquanto aguarda o pagamento.
  useEffect(() => {
    if (status !== 'waiting' || !charge) return;

    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const payment = await getPaymentStatus(charge.payment_id);
        if (cancelled) return;

        if (payment.status === 'APPROVED' && !approvedRef.current) {
          approvedRef.current = true;
          setStatus('approved');
          clearInterval(timer);
          setTimeout(onApproved, 900); // breve tela de sucesso antes de fechar
        } else if (payment.status === 'REJECTED' || payment.status === 'REFUNDED') {
          setStatus('rejected');
          clearInterval(timer);
        }
      } catch {
        // Ignora falhas transitórias de polling; tenta de novo no próximo tick.
      }
    }, POLL_INTERVAL_MS);

    return () => { cancelled = true; clearInterval(timer); };
  }, [status, charge, onApproved]);

  function handleCopy() {
    if (!charge) return;
    navigator.clipboard?.writeText(charge.qr_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">{error}</p>
      )}

      {status === 'creating' && !error && (
        <p className="font-mono text-xs text-stone-500">Gerando cobrança PIX…</p>
      )}

      {charge && status === 'waiting' && (
        <>
          <div className="flex items-center justify-between border border-[#34402f] bg-[#111711] px-4 py-3 font-mono">
            <span className="text-[10px] uppercase tracking-[0.12em] text-stone-500">Valor</span>
            <span className="text-lg font-bold text-lime-300">{formatCurrency(charge.amount)}</span>
          </div>

          {/* QR Code: imagem quando disponível, senão copia-e-cola em destaque */}
          {charge.qr_code_base64 ? (
            <div className="flex justify-center bg-white p-4">
              <img src={`data:image/png;base64,${charge.qr_code_base64}`} alt="QR Code PIX" className="h-56 w-56" />
            </div>
          ) : (
            <div className="border border-dashed border-[#384534] bg-[#0d120d] p-4 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">
                Código copia-e-cola
              </p>
              <p className="mt-2 break-all font-mono text-[11px] leading-5 text-stone-300">{charge.qr_code}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="w-full border border-lime-300/60 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-lime-300 transition hover:bg-lime-300/10"
          >
            {copied ? 'Copiado ✓' : 'Copiar código PIX'}
          </button>

          <div className="flex items-center justify-center gap-2 font-mono text-xs text-stone-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            Aguardando confirmação do pagamento…
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-full border border-[#384534] py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-400 hover:border-stone-500"
          >
            Cancelar
          </button>
        </>
      )}

      {status === 'approved' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-lime-300 text-2xl text-lime-300">✓</div>
          <p className="font-mono text-sm font-bold uppercase tracking-[0.14em] text-lime-300">Pagamento aprovado</p>
        </div>
      )}

      {status === 'rejected' && (
        <div className="space-y-3">
          <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">
            Pagamento não aprovado. Gere um novo PIX ou tente outro método.
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="w-full border border-[#384534] py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-400 hover:border-stone-500"
          >
            Voltar
          </button>
        </div>
      )}
    </div>
  );
}
