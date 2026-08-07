import { useState } from 'react';

import { PlayerQuickSearch } from './features/players/components/PlayerQuickSearch';
import { PlayerRegistrationForm } from './features/players/components/PlayerRegistrationForm';
import { PlayerSelfRegistrationPage } from './features/players/components/PlayerSelfRegistrationPage';
import type { Player } from './features/players/types';
import { formatCpf, formatPhone } from './features/players/validation';

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  if (path === '/register') {
    return <PlayerSelfRegistrationPage />;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#080b08] text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(163,230,53,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(163,230,53,0.028)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-lime-300" />

      <header className="relative border-b border-[#293226] bg-[#0d110d]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="grid h-10 w-10 place-items-center border border-lime-300 bg-lime-300 font-mono text-sm font-black text-[#080b08]">FM</div>
            <div>
              <p className="font-mono text-xs font-bold tracking-[0.24em] text-lime-300">FIELD//MAN</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">Central operacional · jogadores</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden border border-[#3d4839] px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-stone-400 sm:block">Recepção online</span>
            <a href="/register" className="border border-lime-300 px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-lime-200 transition hover:bg-lime-300 hover:text-[#080b08]">
              Cadastro público →
            </a>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
        <section className="border-b border-[#293226] pb-8 lg:flex lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-lime-300">Módulo 01 · players/check-in</p>
            <h1 className="mt-3 text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Recepção de campo.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-400">Cadastre novos jogadores, localize fichas existentes e prepare a seleção para o próximo check-in.</p>
          </div>
          <div className="mt-6 grid grid-cols-2 border border-[#34402f] bg-[#0d120d] font-mono text-xs sm:mt-0">
            <div className="border-r border-[#34402f] px-4 py-3">
              <p className="uppercase tracking-[0.14em] text-stone-500">Canal</p>
              <p className="mt-1 font-bold text-lime-200">PRESENCIAL</p>
            </div>
            <div className="px-4 py-3">
              <p className="uppercase tracking-[0.14em] text-stone-500">Dados</p>
              <p className="mt-1 font-bold text-lime-200">API SEGURA</p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(23rem,0.85fr)]">
          <PlayerRegistrationForm onRegistered={setSelectedPlayer} />
          <div className="space-y-6">
            <PlayerQuickSearch onSelect={setSelectedPlayer} />

            <aside aria-live="polite" className="border border-[#384534] bg-[#0d120d] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.25)] sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-[#2d382a] pb-4">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-lime-300">Próximo check-in</p>
                <span className={`h-2.5 w-2.5 ${selectedPlayer ? 'bg-lime-300 shadow-[0_0_14px_rgba(190,242,100,0.9)]' : 'bg-stone-700'}`} />
              </div>
              {selectedPlayer ? (
                <div className="mt-5">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-stone-500">Operador selecionado</p>
                  <p className="mt-2 text-2xl font-bold text-white">{selectedPlayer.name}</p>
                  <div className="mt-4 grid grid-cols-2 gap-px border border-[#34402f] bg-[#34402f] font-mono text-xs">
                    <div className="bg-[#111711] p-3"><p className="text-stone-500">CADASTRO</p><p className="mt-1 font-bold text-lime-200">#{selectedPlayer.registration_number}</p></div>
                    <div className="bg-[#111711] p-3"><p className="text-stone-500">TELEFONE</p><p className="mt-1 font-bold text-stone-200">{formatPhone(selectedPlayer.phone)}</p></div>
                  </div>
                  <p className="mt-4 font-mono text-xs text-stone-400">CPF // {formatCpf(selectedPlayer.cpf)}</p>
                  <p className="mt-5 border-l-2 border-amber-300 bg-amber-300/5 px-3 py-2 text-sm leading-6 text-amber-100">A abertura da comanda será conectada ao próximo módulo de check-in.</p>
                </div>
              ) : (
                <p className="mt-5 text-sm leading-6 text-stone-400">Selecione um resultado da busca ou conclua um cadastro para preparar o próximo check-in.</p>
              )}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
