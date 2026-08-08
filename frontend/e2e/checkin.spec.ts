import { expect, test } from '@playwright/test';

import { seedSession } from './support/auth';
import { mockApi } from './support/mockApi';

test.describe('Operação · check-in', () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
    await mockApi(page);
    await page.goto('/');
  });

  test('mostra o jogo ativo e permite abrir uma comanda de avulso', async ({ page }) => {
    // Banner do jogo em andamento.
    await expect(page.getByText('EM ANDAMENTO')).toBeVisible();

    // Abre o formulário de check-in.
    await page.getByRole('button', { name: '+ Novo check-in' }).click();

    // Alterna para jogador avulso e preenche.
    await page.getByRole('button', { name: 'Avulso' }).click();
    await page.getByPlaceholder('Nome para identificação na comanda').fill('Visitante Teste');
    await page.getByLabel('Taxa de entrada (R$)').fill('80');

    await page.getByRole('button', { name: 'Abrir comanda' }).click();

    // A comanda recém-criada aparece na lista.
    await expect(page.getByText('Visitante Teste')).toBeVisible();
  });
});
