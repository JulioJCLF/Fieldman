import { useState, type FormEvent } from 'react';

import { useAuth } from './AuthContext';

/**
 * Tela de login do staff. Autentica via Supabase (e-mail + senha) e libera o
 * console operacional. Segue o visual dark/lime do restante da aplicação.
 */
export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080b08] px-5 text-stone-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(163,230,53,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(163,230,53,0.028)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-lime-300" />

      <div className="relative w-full max-w-sm border border-[#384534] bg-[#0d120d] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center border border-lime-300 bg-lime-300 font-mono text-sm font-black text-[#080b08]">FM</div>
          <div>
            <p className="font-mono text-xs font-bold tracking-[0.24em] text-lime-300">FIELD//MAN</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-stone-500">Acesso operacional</p>
          </div>
        </div>

        <h1 className="mt-7 text-2xl font-black uppercase tracking-tight text-white">Entrar</h1>
        <p className="mt-1 text-sm text-stone-400">Use suas credenciais de staff para acessar o console.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-[#34402f] bg-[#111711] px-3 py-2.5 text-sm text-stone-100 outline-none transition focus:border-lime-300"
              placeholder="voce@campo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-[#34402f] bg-[#111711] px-3 py-2.5 text-sm text-stone-100 outline-none transition focus:border-lime-300"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="border-l-2 border-red-400 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-lime-300 bg-lime-300 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#080b08] transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
