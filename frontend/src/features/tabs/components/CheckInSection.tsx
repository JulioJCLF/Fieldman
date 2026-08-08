import { useEffect, useState } from 'react';

import { ApiError, listTabs } from '../api/tabsApi';
import type { TabWithRefills } from '../types';
import { CheckInForm } from './CheckInForm';
import { TabList } from './TabList';

interface Props {
  gameId: string;
}

export function CheckInSection({ gameId }: Props) {
  const [tabs, setTabs]           = useState<TabWithRefills[]>([]);
  const [showForm, setShowForm]   = useState(false);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    listTabs(gameId)
      .then((data) => { if (!cancelled) setTabs(data); })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as comandas.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [gameId]);

  function handleCheckedIn(tab: TabWithRefills) {
    setTabs((prev) => [...prev, tab]);
    setShowForm(false);
  }

  function handleTabUpdated(updated: TabWithRefills) {
    setTabs((prev) => prev.map((t) => t.id === updated.id ? updated : t));
  }

  const equipped = tabs.filter((t) => t.modality === 'EQUIPPED').length;
  const rental   = tabs.filter((t) => t.modality === 'RENTAL').length;

  return (
    <section className="mt-8 border-t border-[#293226] pt-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-lime-300">
            Check-in · Comandas
          </p>
          {tabs.length > 0 && (
            <p className="mt-1 font-mono text-[10px] text-stone-500">
              {tabs.length} jogador{tabs.length !== 1 ? 'es' : ''} · {equipped} equipado{equipped !== 1 ? 's' : ''} · {rental} aluguel{rental !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="border border-lime-300 px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-lime-200 transition hover:bg-lime-300 hover:text-[#080b08]"
          >
            + Novo check-in
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3">
        {showForm && (
          <CheckInForm
            gameId={gameId}
            onCheckedIn={handleCheckedIn}
            onCancel={() => setShowForm(false)}
          />
        )}

        {loading && (
          <p className="font-mono text-xs text-stone-500">Carregando comandas…</p>
        )}

        {error && (
          <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && (
          <TabList tabs={tabs} onTabUpdated={handleTabUpdated} />
        )}
      </div>
    </section>
  );
}
