import type { Page } from '@playwright/test';

/** Envelope padrão da API. */
function ok(data: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) };
}

/**
 * Intercepta as rotas /api/* usadas pelos fluxos E2E, devolvendo respostas
 * determinísticas. Permite rodar os testes sem backend/Supabase reais.
 */
export async function mockApi(page: Page): Promise<void> {
  const activeGame = {
    id: 'game-1', type: 'OPEN', game_date: '2026-08-08', status: 'IN_PROGRESS',
    notes: null, created_at: '', updated_at: '',
  };

  await page.route('**/api/games/active', (route) => route.fulfill(ok(activeGame)));

  await page.route('**/api/games/game-1/tabs/summary', (route) =>
    route.fulfill(ok({ equipped_count: 0, rental_count: 0, total_entry_revenue: 0, total_refills_revenue: 0, total_revenue: 0 })),
  );

  // Lista de comandas (GET) e criação de check-in (POST) na mesma URL.
  const tabs: unknown[] = [];
  await page.route('**/api/games/game-1/tabs', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Record<string, unknown>;
      const tab = {
        id: 'tab-1', game_id: 'game-1', player_id: null, guest_name: body.guest_name,
        player_name: body.player_name, modality: body.modality, entry_fee: body.entry_fee,
        entry_status: 'PENDING', created_at: '', updated_at: '', refills: [], payments: [],
      };
      tabs.push(tab);
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: tab }) });
      return;
    }
    await route.fulfill(ok(tabs));
  });
}
