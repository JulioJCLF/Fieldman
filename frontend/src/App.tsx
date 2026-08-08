import { useState } from 'react';

import { useAuth } from './features/auth/AuthContext';
import { LoginPage } from './features/auth/LoginPage';
import { AnalyticsPanel } from './features/analytics/components/AnalyticsPanel';
import { DashboardPanel } from './features/dashboard/DashboardPanel';
import { GamePanel } from './features/games/components/GamePanel';
import { HistoryPanel } from './features/games/components/HistoryPanel';
import { InventoryPanel } from './features/inventory/components/InventoryPanel';
import { PlayerQuickSearch } from './features/players/components/PlayerQuickSearch';
import { PlayerRegistrationForm } from './features/players/components/PlayerRegistrationForm';
import { PlayerSelfRegistrationPage } from './features/players/components/PlayerSelfRegistrationPage';
import { UsersPanel } from './features/users/components/UsersPanel';
import type { Player } from './features/players/types';
import { formatCpf, formatPhone } from './features/players/validation';
import { NAV_ITEMS, type AppView } from './navigation';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const { session, loading, signOut } = useAuth();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [view, setView] = useState<AppView>('home');

  // Cadastro público de jogador: acessível sem login.
  if (path === '/register') {
    return <PlayerSelfRegistrationPage />;
  }

  // Console operacional: exige sessão de staff.
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface text-xs text-outline">
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
          <button type="button" onClick={() => setView('home')} className="flex items-center gap-4 text-left">
            <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary bg-primary text-sm font-semibold text-on-primary">FM</div>
            <div>
              <p className="text-xs font-bold text-primary">FIELD//MAN</p>
              <p className="mt-0.5 text-[10px] text-outline">Central operacional</p>
            </div>
          </button>
          <div className="flex items-center gap-3">
            <a href="/register" className="rounded-lg border border-primary px-3 py-2 text-[10px] font-semibold text-primary transition hover:bg-primary hover:text-on-primary">
              Cadastro público →
            </a>
            <button
              type="button"
              onClick={() => void signOut()}
              className="rounded-lg border border-outline-variant px-3 py-2 text-[10px] font-semibold text-on-surface-variant transition hover:border-outline hover:text-on-surface"
            >
              Sair
            </button>
          </div>
        </div>

        {/* Navegação entre módulos */}
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-5 sm:px-8 lg:px-10">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              type="button"
              onClick={() => setView(item.view)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition ${
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
        {view === 'home' && <DashboardPanel onNavigate={setView} />}
        {view === 'games' && <GamePanel />}
        {view === 'history' && <HistoryPanel />}
        {view === 'snackbar' && <InventoryPanel channel="SNACKBAR" />}
        {view === 'store' && <InventoryPanel channel="STORE" />}
        {view === 'analytics' && <AnalyticsPanel />}
        {view === 'users' && <UsersPanel />}

        {view === 'reception' && (
          <>
            <section className="border-b border-outline-variant pb-8">
              <p className="text-xs font-bold text-primary">Módulo 01 · players/check-in</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">Recepção de campo.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-on-surface-variant">Cadastre novos jogadores, localize fichas existentes e prepare a seleção para o próximo check-in.</p>
            </section>

            <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)]">
              <PlayerRegistrationForm onRegistered={setSelectedPlayer} />
              <div className="space-y-6">
                <PlayerQuickSearch onSelect={setSelectedPlayer} />

                <aside aria-live="polite" className="rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-panel sm:p-6">
                  <div className="flex items-center justify-between gap-4 border-b border-outline-variant pb-4">
                    <p className="text-xs font-bold text-primary">Próximo check-in</p>
                    <span className={`h-2.5 w-2.5 rounded-full ${selectedPlayer ? 'bg-primary shadow-[0_0_14px_rgba(255,94,0,0.9)]' : 'bg-surface-container'}`} />
                  </div>
                  {selectedPlayer ? (
                    <div className="mt-5">
                      <p className="text-[11px] text-outline">Operador selecionado</p>
                      <p className="mt-2 text-2xl font-bold text-on-surface">{selectedPlayer.name}</p>
                      <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-outline-variant bg-outline-variant text-xs">
                        <div className="bg-surface-low p-3"><p className="text-outline">Cadastro</p><p className="mt-1 font-bold text-primary">#{selectedPlayer.registration_number}</p></div>
                        <div className="bg-surface-low p-3"><p className="text-outline">Telefone</p><p className="mt-1 font-bold text-on-surface">{formatPhone(selectedPlayer.phone)}</p></div>
                      </div>
                      <p className="mt-4 text-xs text-on-surface-variant">CPF · {formatCpf(selectedPlayer.cpf)}</p>
                      <button
                        type="button"
                        onClick={() => setView('games')}
                        className="mt-5 block w-full rounded-lg border-l-4 border-primary bg-primary/5 px-3 py-2 text-left text-sm leading-6 text-primary transition hover:bg-primary/10"
                      >
                        Ir para a aba Jogos para fazer o check-in deste jogador →
                      </button>
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
