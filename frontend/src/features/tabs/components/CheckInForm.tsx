import { useState } from 'react';

import { searchPlayerExact } from '../../players/api/playersApi';
import type { Player } from '../../players/types';
import { ApiError, createTab } from '../api/tabsApi';
import type { TabModality, TabWithRefills } from '../types';

interface Props {
  gameId: string;
  onCheckedIn: (tab: TabWithRefills) => void;
  onCancel: () => void;
}

type PlayerMode = 'registered' | 'guest';

const MODALITY_LABELS: Record<TabModality, string> = {
  EQUIPPED: 'Equipado',
  RENTAL:   'Aluguel',
};

export function CheckInForm({ gameId, onCheckedIn, onCancel }: Props) {
  const [mode, setMode]               = useState<PlayerMode>('registered');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundPlayer, setFoundPlayer] = useState<Player | null>(null);
  const [searching, setSearching]     = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [guestName, setGuestName]     = useState('');
  const [modality, setModality]       = useState<TabModality>('RENTAL');
  const [entryFee, setEntryFee]       = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);

  async function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;

    setSearching(true);
    setSearchError(null);
    setFoundPlayer(null);

    const isNumber = /^\d+$/.test(q.replace(/\D/g, '')) && q.replace(/\D/g, '').length >= 3;
    const field = q.length === 11 && /^\d+$/.test(q.replace(/\D/g, ''))
      ? 'cpf'
      : isNumber && q.replace(/\D/g, '').length >= 10
        ? 'phone'
        : 'registration_number';

    try {
      const player = await searchPlayerExact(
        { field, value: q.replace(/\D/g, '') },
        new AbortController().signal,
      );
      if (player) {
        setFoundPlayer(player);
      } else {
        setSearchError('Jogador não encontrado. Verifique o número, CPF ou telefone.');
      }
    } catch {
      setSearchError('Erro ao buscar jogador. Tente novamente.');
    } finally {
      setSearching(false);
    }
  }

  function handleModeChange(next: PlayerMode) {
    setMode(next);
    setFoundPlayer(null);
    setSearchQuery('');
    setSearchError(null);
    setGuestName('');
    setSubmitError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);

    const fee = parseFloat(entryFee.replace(',', '.'));
    if (isNaN(fee) || fee < 0) {
      setSubmitError('Informe uma taxa de entrada válida.');
      return;
    }

    if (mode === 'registered' && !foundPlayer) {
      setSubmitError('Busque e selecione um jogador antes de confirmar.');
      return;
    }
    if (mode === 'guest' && !guestName.trim()) {
      setSubmitError('Informe o nome do jogador avulso.');
      return;
    }

    setSubmitting(true);
    try {
      const tab = await createTab(gameId, {
        player_id:   mode === 'registered' ? foundPlayer!.id : undefined,
        guest_name:  mode === 'guest'      ? guestName.trim() : undefined,
        player_name: mode === 'registered' ? foundPlayer!.name : guestName.trim(),
        modality,
        entry_fee:   fee,
      });
      onCheckedIn(tab);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Erro ao fazer check-in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-[#384534] bg-[#0d120d] p-5 sm:p-6">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">
        Novo check-in
      </p>

      <div className="mt-5 space-y-5">
        {/* Modo: cadastrado ou avulso */}
        <div className="flex gap-2">
          {(['registered', 'guest'] as PlayerMode[]).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => handleModeChange(opt)}
              className={`border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] transition ${
                mode === opt
                  ? 'border-lime-300 bg-lime-300/10 text-lime-300'
                  : 'border-[#384534] text-stone-400 hover:border-stone-500'
              }`}
            >
              {opt === 'registered' ? 'Cadastrado' : 'Avulso'}
            </button>
          ))}
        </div>

        {/* Busca de jogador cadastrado */}
        {mode === 'registered' && (
          <div>
            <label className="block font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
              Buscar por nº cadastro, CPF ou telefone
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setFoundPlayer(null); }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                placeholder="Ex: 42 · 529.982.247-25 · (11) 9999-9999"
                className="flex-1 border border-[#384534] bg-[#111711] px-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-lime-300/50"
              />
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="border border-[#384534] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.12em] text-stone-400 hover:border-stone-500 disabled:opacity-40"
              >
                {searching ? '…' : 'Buscar'}
              </button>
            </div>

            {searchError && (
              <p className="mt-2 font-mono text-xs text-red-400">{searchError}</p>
            )}

            {foundPlayer && (
              <div className="mt-3 border border-lime-300/30 bg-lime-300/5 px-4 py-3">
                <p className="font-mono text-xs font-bold text-lime-200">{foundPlayer.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-stone-500">
                  Cad. #{foundPlayer.registration_number} · CPF {foundPlayer.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nome do avulso */}
        {mode === 'guest' && (
          <div>
            <label htmlFor="guest-name" className="block font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
              Nome do avulso
            </label>
            <input
              id="guest-name"
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Nome para identificação na comanda"
              className="mt-2 w-full border border-[#384534] bg-[#111711] px-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-lime-300/50"
            />
          </div>
        )}

        {/* Modalidade */}
        <fieldset>
          <legend className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
            Modalidade
          </legend>
          <div className="mt-2 flex gap-3">
            {(['EQUIPPED', 'RENTAL'] as TabModality[]).map((opt) => (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 border px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] transition ${
                  modality === opt
                    ? 'border-lime-300 bg-lime-300/10 text-lime-300'
                    : 'border-[#384534] text-stone-400 hover:border-stone-500'
                }`}
              >
                <input
                  type="radio"
                  name="modality"
                  value={opt}
                  checked={modality === opt}
                  onChange={() => setModality(opt)}
                  className="sr-only"
                />
                {MODALITY_LABELS[opt]}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Taxa de entrada */}
        <div>
          <label htmlFor="entry-fee" className="block font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
            Taxa de entrada (R$)
          </label>
          <input
            id="entry-fee"
            type="text"
            inputMode="decimal"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            placeholder="0,00"
            className="mt-2 w-full border border-[#384534] bg-[#111711] px-3 py-2 text-sm text-stone-200 placeholder-stone-600 outline-none focus:border-lime-300/50"
          />
        </div>

        {submitError && (
          <p className="border-l-2 border-red-400 bg-red-400/5 px-3 py-2 font-mono text-xs text-red-300">
            {submitError}
          </p>
        )}

        <div className="flex justify-end gap-3 border-t border-[#2d382a] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="border border-[#384534] px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-stone-400 hover:border-stone-500 hover:text-stone-200 disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="border border-lime-300 bg-lime-300 px-5 py-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#080b08] hover:bg-lime-200 disabled:opacity-40"
          >
            {submitting ? 'Abrindo…' : 'Abrir comanda'}
          </button>
        </div>
      </div>
    </form>
  );
}
