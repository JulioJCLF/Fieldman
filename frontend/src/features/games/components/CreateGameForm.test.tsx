import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateGameForm } from './CreateGameForm';
import type { Game } from '../types';

vi.mock('../api/gamesApi', () => ({
  ApiError: class ApiError extends Error {},
  createGame: vi.fn(),
  startGame: vi.fn(),
}));

import { createGame, startGame } from '../api/gamesApi';

const scheduled: Game = { id: 'g1', type: 'OPEN', game_date: '2026-08-08', status: 'SCHEDULED', notes: null, created_at: '', updated_at: '' };
const started: Game = { ...scheduled, status: 'IN_PROGRESS' };

describe('CreateGameForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates then starts a game and reports the started game', async () => {
    vi.mocked(createGame).mockResolvedValue(scheduled);
    vi.mocked(startGame).mockResolvedValue(started);
    const onGameStarted = vi.fn();

    render(<CreateGameForm onGameStarted={onGameStarted} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /criar e iniciar/i }));

    expect(createGame).toHaveBeenCalledWith(expect.objectContaining({ type: 'OPEN' }));
    expect(startGame).toHaveBeenCalledWith('g1');
    expect(onGameStarted).toHaveBeenCalledWith(started);
  });

  it('lets the user pick the private game type', async () => {
    vi.mocked(createGame).mockResolvedValue({ ...scheduled, type: 'PRIVATE' });
    vi.mocked(startGame).mockResolvedValue({ ...started, type: 'PRIVATE' });

    render(<CreateGameForm onGameStarted={vi.fn()} onCancel={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Fechado' }));
    await userEvent.click(screen.getByRole('button', { name: /criar e iniciar/i }));

    expect(createGame).toHaveBeenCalledWith(expect.objectContaining({ type: 'PRIVATE' }));
  });
});
