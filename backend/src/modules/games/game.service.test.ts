import { describe, expect, it, vi } from 'vitest';

import { HttpError } from '../../shared/errors.js';
import { GameService } from './game.service.js';
import type { Game, GamesRepository } from './game.types.js';

function makeGame(overrides: Partial<Game> = {}): Game {
  return {
    id: 'g1', type: 'OPEN', game_date: '2026-08-08', status: 'SCHEDULED',
    notes: null, created_at: '', updated_at: '', ...overrides,
  };
}

function fakeRepo(overrides: Partial<GamesRepository> = {}): GamesRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findActive: vi.fn().mockResolvedValue(null),
    updateStatus: vi.fn(),
    listByDate: vi.fn(),
    ...overrides,
  };
}

describe('GameService', () => {
  it('blocks creating a game while another is in progress', async () => {
    const repo = fakeRepo({ findActive: vi.fn().mockResolvedValue(makeGame({ status: 'IN_PROGRESS' })) });
    const service = new GameService(repo);

    await expect(service.create({ type: 'OPEN', game_date: '2026-08-08' }))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates a game when none is active', async () => {
    const created = makeGame();
    const repo = fakeRepo({ create: vi.fn().mockResolvedValue(created) });
    const service = new GameService(repo);

    await expect(service.create({ type: 'OPEN', game_date: '2026-08-08' })).resolves.toBe(created);
  });

  it('only starts scheduled games', async () => {
    const repo = fakeRepo({ findById: vi.fn().mockResolvedValue(makeGame({ status: 'FINISHED' })) });
    const service = new GameService(repo);

    await expect(service.start('g1')).rejects.toMatchObject({ statusCode: 422 });
  });

  it('starts a scheduled game and transitions to IN_PROGRESS', async () => {
    const repo = fakeRepo({
      findById: vi.fn().mockResolvedValue(makeGame({ status: 'SCHEDULED' })),
      updateStatus: vi.fn().mockResolvedValue(makeGame({ status: 'IN_PROGRESS' })),
    });
    const service = new GameService(repo);

    const result = await service.start('g1');
    expect(result.status).toBe('IN_PROGRESS');
    expect(repo.updateStatus).toHaveBeenCalledWith('g1', 'IN_PROGRESS');
  });

  it('only finishes games that are in progress', async () => {
    const repo = fakeRepo({ findById: vi.fn().mockResolvedValue(makeGame({ status: 'SCHEDULED' })) });
    const service = new GameService(repo);

    await expect(service.finish('g1')).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws 404 for an unknown game', async () => {
    const repo = fakeRepo({ findById: vi.fn().mockResolvedValue(null) });
    const service = new GameService(repo);

    await expect(service.getById('missing')).rejects.toBeInstanceOf(HttpError);
    await expect(service.getById('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});
