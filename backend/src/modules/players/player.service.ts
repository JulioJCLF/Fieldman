import { HttpError } from '../../shared/errors.js';
import { isDuplicateCpfError } from './player.repository.js';
import type { CreatePlayerInput, Player, PlayerSearchCriterion, PlayersRepository } from './player.types.js';

export interface PlayerServicePort {
  register(input: CreatePlayerInput): Promise<Player>;
  search(criteria: PlayerSearchCriterion): Promise<Player | null>;
}

export class PlayerService implements PlayerServicePort {
  public constructor(private readonly repository: PlayersRepository) {}

  public async register(input: CreatePlayerInput): Promise<Player> {
    try {
      return await this.repository.create(input);
    } catch (error) {
      if (isDuplicateCpfError(error)) {
        throw new HttpError(409, 'J\u00e1 existe um jogador cadastrado com este CPF.');
      }

      throw error;
    }
  }

  public search(criteria: PlayerSearchCriterion): Promise<Player | null> {
    return this.repository.findBy(criteria);
  }
}
