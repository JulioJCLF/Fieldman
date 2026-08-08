import { useState } from 'react';

import { useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { AnalyticsPanel } from './features/analytics/components/AnalyticsPanel';
import { GamePanel } from './features/games/components/GamePanel';
import { InventoryPanel } from './features/inventory/components/InventoryPanel';
import { PlayerQuickSearch } from './features/players/components/PlayerQuickSearch';
import { PlayerRegistrationForm } from './features/players/components/PlayerRegistrationForm';
import { PlayerSelfRegistrationPage } from './features/players/components/PlayerSelfRegistrationPage';
import type { Player } from './features/players/types';
import { formatCpf, formatPhone } from './features/players/validation';

type View = 'operation' | 'snackbar' | 'store' | 'analytics';

const NAV_ITEMS: { view: View; label: string }[] = [
  { view: 'operation', label: 'Operação' },
  { view: 'snackbar',  label: 'Lanchonete' },
  { view: 'store',     label: 'Loja' },
  { view: 'analytics', label: 'Gestão' },
];

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const { session, loading, signOut } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [view, setView] = useState<View>('operation');

  // Cadastro público de jogador: acessível sem login.
  if (path === '/register') {
    return <PlayerSelfRegistrationPage />;
  }

  // Console operacional: exige sessão de staff.
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-xs uppercase tracking-[0.2em] text-outline">
        Carregando…
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-on-surface">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,94,0,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,94,0,0.028)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-primary" />

      <header className="relative border-b border-outline-variant bg-surface-lowest/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary bg-primary text-sm font-black text-on-primary">FM</div>
            <div>
              <p className="text-xs font-bold tracking-[0.24em] text-primary">FIELD//MAN</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-outline">Central operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-outline-variant bg-surface-container px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant sm:block">Recepção online</span>
            <a href="/register" className="rounded-lg border border-primary px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-primary transition hover:bg-primary hover:text-on-primary">
              Cadastro público →
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-outline-variant px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-on-surface-variant transition hover:border-outline hover:text-on-surface"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Navegação entre módulos */}
        <nav className="mx-auto flex max-w-7xl gap-1 px-5 sm:px-8 lg:px-10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              className={`border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] transition ${
                view === item.view
                  ? 'border-primary text-primary'
                  : 'border-transparent text-outline hover:text-on-surface-variant'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        {view === 'snackbar' && <InventoryPanel channel="SNACKBAR" />}
        {view === 'store' && <InventoryPanel channel="STORE" />}
        {view === 'analytics' && <AnalyticsPanel />}

        {view === 'operation' && (
          <>
            <GamePanel />

            <section className="mt-10 border-b border-outline-variant pb-8 lg:flex lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Módulo 01 · players/check-in</p>
                <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-on-surface sm:text-5xl">Recepção de campo.</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">Cadastre novos jogadores, localize fichas existentes e prepare a seleção para o próximo check-in.</p>
              </div>
              <div className="mt-6 grid grid-cols-2 overflow-hidden rounded-lg border border-outline-variant bg-surface-lowest text-xs shadow-panel sm:mt-0">
                <div className="border-r border-outline-variant px-4 py-3">
                  <p className="uppercase tracking-[0.14em] text-outline">Canal</p>
                  <p className="mt-1 font-bold text-primary">PRESENCIAL</p>
                </div>
                <div className="px-4 py-3">
                  <p className="uppercase tracking-[0.14em] text-outline">Dados</p>
                  <p className="mt-1 font-bold text-primary">API SEGURA</p>
                </div>
              </div>
            </section>

            <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)]">
              <PlayerRegistrationForm onRegistered={setSelectedPlayer} />
              <div className="space-y-6">
                <PlayerQuickSearch onSelect={setSelectedPlayer} />

                <aside aria-live="polite" className="rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-panel sm:p-6">
                  <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Próximo check-in</p>
                    <span className={`h-2.5 w-2.5 ${selectedPlayer ? 'bg-primary shadow-[0_0_14px_rgba(255,94,0,0.9)]' : 'bg-surface-container'}`} />
                  </div>
                  {selectedPlayer ? (
                    <div className="mt-5">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-outline">Operador selecionado</p>
                      <p className="mt-2 text-2xl font-bold text-on-surface">{selectedPlayer.name}</p>
                      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-outline-variant bg-outline-variant text-xs">
                        <div className="bg-surface-low p-3"><p className="text-outline">CADASTRO</p><p className="mt-1 font-bold text-primary">#{selectedPlayer.registration_number}</p></div>
                        <div className="bg-surface-low p-3"><p className="text-outline">TELEFONE</p><p className="mt-1 font-bold text-on-surface">{formatPhone(selectedPlayer.phone)}</p></div>
                      </div>
                      <p className="mt-4 text-xs text-on-surface-variant">CPF // {formatCpf(selectedPlayer.cpf)}</p>
                      <p className="mt-5 border-l-2 border-primary bg-primary/5 px-3 py-2 text-sm leading-6 text-primary">Abra um jogo na aba Operação para iniciar o check-in deste jogador.</p>
                    </div>
                  ) : (
                    <p className="mt-5 text-sm leading-6 text-on-surface-variant">Selecione um resultado da busca ou conclua um cadastro para preparar o próximo check-in.</p>
                  )}
                </aside>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
