import type { SupabaseClient, User } from '@supabase/supabase-js';
import express, { type Express } from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { failure, success } from '../../shared/api.js';
import { createAuthMiddleware } from './auth.middleware.js';

const fakeUser = { id: 'user-1', email: 'staff@fieldman.app' } as User;

/**
 * Monta um app mínimo com o middleware real e um par de rotas: uma protegida
 * e a rota pública de auto-cadastro de jogador.
 */
function buildApp(getUser: SupabaseClient['auth']['getUser']): Express {
  const supabase = { auth: { getUser } } as unknown as SupabaseClient;
  const app = express();
  app.use(express.json());
  app.use('/api', createAuthMiddleware(supabase));
  app.post('/api/players', (_request, response) => response.status(201).json(success({ ok: true })));
  app.get('/api/games', (_request, response) => response.status(200).json(success({ ok: true })));
  app.use((_request, response) => response.status(404).json(failure('Rota não encontrada.')));
  return app;
}

describe('auth middleware', () => {
  it('libera a rota pública de auto-cadastro sem token', async () => {
    const getUser = vi.fn();
    const response = await request(buildApp(getUser)).post('/api/players').send({});

    expect(response.status).toBe(201);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('responde 401 quando não há token na rota protegida', async () => {
    const getUser = vi.fn();
    const response = await request(buildApp(getUser)).get('/api/games');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('responde 401 quando o token é inválido', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
    const response = await request(buildApp(getUser))
      .get('/api/games')
      .set('Authorization', 'Bearer bad-token');

    expect(response.status).toBe(401);
    expect(getUser).toHaveBeenCalledWith('bad-token');
  });

  it('libera a rota protegida quando o token é válido', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: fakeUser }, error: null });
    const response = await request(buildApp(getUser))
      .get('/api/games')
      .set('Authorization', 'Bearer good-token');

    expect(response.status).toBe(200);
    expect(getUser).toHaveBeenCalledWith('good-token');
  });
});
