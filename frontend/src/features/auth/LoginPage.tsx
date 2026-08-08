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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-5 text-on-surface">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,94,0,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(255,94,0,0.028)_1px,transparent_1px)] bg-[size:28px_28px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-1 bg-primary" />

      <div className="relative w-full max-w-sm rounded-2xl border border-outline-variant bg-surface-lowest p-7 shadow-panel-lg sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary bg-primary text-sm font-semibold text-on-primary">FM</div>
          <div>
            <p className="text-xs font-bold text-primary">FIELD//MAN</p>
            <p className="mt-0.5 text-[10px] text-outline">Acesso operacional</p>
          </div>
        </div>

        <h1 className="mt-7 text-2xl font-semibold tracking-tight text-on-surface">Entrar</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Use suas credenciais de staff para acessar o console.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="text-[10px] font-bold text-outline">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="voce@campo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-[10px] font-bold text-outline">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-outline-variant bg-surface-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p role="alert" className="border-l-2 border-error bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg border border-primary bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
