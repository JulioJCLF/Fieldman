import type { Page } from '@playwright/test';

/**
 * Semeia uma sessão de staff fictícia no localStorage, no formato que o
 * supabase-js espera (chave `sb-<ref>-auth-token`). Com VITE_SUPABASE_URL
 * apontando para https://test.supabase.co, o ref é `test`.
 *
 * Isso faz o AuthProvider considerar o usuário autenticado e renderizar o
 * console, sem precisar de rede — a API é mockada separadamente (mockApi).
 */
export async function seedSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const session = {
      access_token: 'e2e-access-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: expiresAt,
      refresh_token: 'e2e-refresh-token',
      user: {
        id: 'e2e-user',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'e2e@fieldman.app',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-01-01T00:00:00.000Z',
      },
    };
    window.localStorage.setItem('sb-test-auth-token', JSON.stringify(session));
  });
}
