import { HttpError } from '../../shared/errors.js';
import type { CreateGameInput, Game, GameHistoryItem, GamesRepository } from './game.types.js';

export interface GameServicePort {
  create(input: CreateGameInput): Promise<Game>;
  start(id: string): Promise<Game>;
  finish(id: string): Promise<Game>;
  getActive(): Promise<Game | null>;
  getById(id: string): Promise<Game>;
  listByDate(date: string): Promise<Game[]>;
  listHistory(): Promise<GameHistoryItem[]>;
}

export class GameService implements GameServicePort {
  public constructor(private readonly repository: GamesRepository) {}

  public async create(input: CreateGameInput): Promise<Game> {
    const active = await this.repository.findActive();
    if (active) {
      throw new HttpError(409, 'Já existe um jogo em andamento. Finalize-o antes de criar um novo.');
    }
    return this.repository.create(input);
  }

  public async start(id: string): Promise<Game> {
    const game = await this.requireGame(id);

    if (game.status !== 'SCHEDULED') {
      throw new HttpError(422, 'Apenas jogos agendados podem ser iniciados.');
    }

    const active = await this.repository.findActive();
    if (active) {
      throw new HttpError(409, 'Já existe um jogo em andamento. Finalize-o antes de iniciar outro.');
    }

    return this.repository.updateStatus(id, 'IN_PROGRESS');
  }

  public async finish(id: string): Promise<Game> {
    const game = await this.requireGame(id);

    if (game.status !== 'IN_PROGRESS') {
      throw new HttpError(422, 'Apenas jogos em andamento podem ser finalizados.');
    }

    return this.repository.updateStatus(id, 'FINISHED');
  }

  public getActive(): Promise<Game | null> {
    return this.repository.findActive();
  }

  public async getById(id: string): Promise<Game> {
    return this.requireGame(id);
  }

  public listByDate(date: string): Promise<Game[]> {
    return this.repository.listByDate(date);
  }

  public listHistory(): Promise<GameHistoryItem[]> {
    return this.repository.listHistoryWithStats();
  }

  private async requireGame(id: string): Promise<Game> {
    const game = await this.repository.findById(id);
    if (!game) {
      throw new HttpError(404, 'Jogo não encontrado.');
    }
    return game;
  }
}
