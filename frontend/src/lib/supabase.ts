import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase do frontend, usado apenas para autenticação do staff
 * (login por e-mail e senha). Usa a chave publishable/anon — nunca a service role.
 * A sessão é persistida no localStorage e renovada automaticamente.
 */
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuração do Supabase ausente. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env do frontend.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Retorna o access token da sessão atual, ou null se não houver sessão. */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
