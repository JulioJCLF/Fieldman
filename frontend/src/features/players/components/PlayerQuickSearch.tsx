import { useEffect, useMemo, useState } from 'react';

import { searchPlayerExact } from '../api/playersApi';
import type { Player, PlayerSearchField } from '../types';
import {
  formatCpf,
  formatPhone,
  isValidCpf,
  isValidPhone,
  onlyDigits,
  toBrazilianPhoneDigits,
} from '../validation';

interface PlayerQuickSearchProps {
  onSelect: (player: Player) => void;
}

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; player: Player }
  | { status: 'error'; message: string };

const searchOptions: Array<{ value: PlayerSearchField; label: string; placeholder: string; hint: string }> = [
  {
    value: 'registration_number',
    label: 'Nº de cadastro',
    placeholder: 'Ex.: 1024',
    hint: 'Digite o número sequencial do jogador.',
  },
  {
    value: 'cpf',
    label: 'CPF',
    placeholder: '000.000.000-00',
    hint: 'Digite um CPF válido para pesquisa exata.',
  },
  {
    value: 'phone',
    label: 'Telefone',
    placeholder: '(11) 99999-9999',
    hint: 'Digite telefone com DDD para pesquisa exata.',
  },
];

function isCompleteSearchValue(field: PlayerSearchField, value: string): boolean {
  switch (field) {
    case 'registration_number':
      return /^[1-9]\d*$/.test(value);
    case 'cpf':
      return isValidCpf(value);
    case 'phone':
      return isValidPhone(value);
  }
}

function normalizeSearchValue(field: PlayerSearchField, value: string): string {
  switch (field) {
    case 'registration_number':
      return onlyDigits(value);
    case 'cpf':
      return onlyDigits(value);
    case 'phone':
      return toBrazilianPhoneDigits(value);
  }
}

function formatSearchInput(field: PlayerSearchField, value: string): string {
  switch (field) {
    case 'registration_number':
      return onlyDigits(value);
    case 'cpf':
      return formatCpf(value);
    case 'phone':
      return formatPhone(value);
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  );
}

export function PlayerQuickSearch({ onSelect }: PlayerQuickSearchProps) {
  const [searchField, setSearchField] = useState<PlayerSearchField>('registration_number');
  const [query, setQuery] = useState('');
  const [searchState, setSearchState] = useState<SearchState>({ status: 'idle' });

  const option = searchOptions.find((item) => item.value === searchField) ?? searchOptions[0];
  const normalizedQuery = useMemo(
    () => normalizeSearchValue(searchField, query),
    [query, searchField],
  );
  const canSearch = isCompleteSearchValue(searchField, normalizedQuery);

  useEffect(() => {
    if (!canSearch) {
      setSearchState({ status: 'idle' });
      return undefined;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSearchState({ status: 'loading' });

      void searchPlayerExact(
        { field: searchField, value: normalizedQuery },
        controller.signal,
      )
        .then((player) => {
          if (!controller.signal.aborted) {
            setSearchState(player ? { status: 'ready', player } : { status: 'empty' });
          }
        })
        .catch((error: unknown) => {
          if (isAbortError(error)) {
            return;
          }

          const message = error instanceof Error ? error.message : 'Não foi possível pesquisar o jogador.';
          setSearchState({ status: 'error', message });
        });
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canSearch, normalizedQuery, searchField]);

  const handleFieldChange = (field: PlayerSearchField) => {
    setSearchField(field);
    setQuery('');
    setSearchState({ status: 'idle' });
  };

  return (
    <section aria-labelledby="quick-search-title" className="border border-outline-variant bg-surface-lowest p-5 text-on-surface shadow-panel sm:p-7">
      <div className="mb-6 border-b border-outline-variant pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Recepção // consulta</p>
        <h2 id="quick-search-title" className="mt-2 text-2xl font-bold tracking-tight">Busca rápida para check-in</h2>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">Localize uma ficha existente sem navegar por listas.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(10rem,0.7fr)_minmax(0,1.3fr)]">
        <div>
          <label htmlFor="player-search-field" className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Buscar por</label>
          <select
            id="player-search-field"
            value={searchField}
            onChange={(event) => handleFieldChange(event.target.value as PlayerSearchField)}
            className="mt-2 block min-h-[3rem] w-full border border-outline-variant bg-surface-low px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {searchOptions.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="player-search-query" className="text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant">Consulta exata</label>
          <input
            id="player-search-query"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(formatSearchInput(searchField, event.target.value))}
            placeholder={option.placeholder}
            aria-describedby="player-search-hint player-search-status"
            className="mt-2 block min-h-[3rem] w-full border border-outline-variant bg-surface-low px-3 py-2.5 text-sm text-on-surface outline-none transition placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <p id="player-search-hint" className="mt-3 text-[11px] text-outline">// {option.hint}</p>

      <div id="player-search-status" aria-live="polite" className="mt-4 min-h-6">
        {query && !canSearch && (
          <p className="text-sm text-amber-200">Complete o valor para iniciar a busca.</p>
        )}
        {searchState.status === 'loading' && <p className="text-sm text-on-surface-variant">Buscando jogador…</p>}
        {searchState.status === 'empty' && <p className="text-sm text-on-surface-variant">Nenhum jogador encontrado com esse dado.</p>}
        {searchState.status === 'error' && <p role="alert" className="text-sm text-rose-300">{searchState.message}</p>}
      </div>

      {searchState.status === 'ready' && (
        <div className="mt-4 border border-primary/40 bg-surface-low p-4 text-on-surface">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                Cadastro #{searchState.player.registration_number}
              </p>
              <p className="mt-2 text-lg font-semibold text-on-surface">{searchState.player.name}</p>
              <p className="mt-2 text-xs text-on-surface-variant">
                {formatCpf(searchState.player.cpf)} · {formatPhone(searchState.player.phone)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelect(searchState.player)}
              className="min-h-[3rem] bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-on-primary transition hover:bg-primary focus:outline-none focus:ring-4 focus:ring-primary/30"
            >
              Selecionar para check-in
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
