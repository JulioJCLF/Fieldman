import { HttpError } from '../../shared/errors.js';
import type { GamesRepository } from '../games/game.types.js';
import type {
  CreateRefillInput,
  CreateTabInput,
  GameTabsSummary,
  GatewayPayment,
  PaymentMethod,
  Refill,
  TabWithRefills,
  TabsRepository,
} from './tab.types.js';

export interface TabServicePort {
  checkin(input: CreateTabInput): Promise<TabWithRefills>;
  listTabs(gameId: string): Promise<TabWithRefills[]>;
  getGameSummary(gameId: string): Promise<GameTabsSummary>;
  getTab(tabId: string): Promise<TabWithRefills>;
  addRefill(tabId: string, input: Omit<CreateRefillInput, 'tab_id'>): Promise<Refill>;
  markRefillPaid(tabId: string, refillId: string): Promise<Refill>;
  checkout(tabId: string, method: PaymentMethod): Promise<GatewayPayment>;
}

export class TabService implements TabServicePort {
  public constructor(
    private readonly repo: TabsRepository,
    private readonly gamesRepo: GamesRepository,
  ) {}

  public async checkin(input: CreateTabInput): Promise<TabWithRefills> {
    const game = await this.gamesRepo.findById(input.game_id);
    if (!game) {
      throw new HttpError(404, 'Jogo não encontrado.');
    }
    if (game.status !== 'IN_PROGRESS') {
      throw new HttpError(422, 'Só é possível fazer check-in em jogos em andamento.');
    }
    return this.repo.createTab(input);
  }

  public listTabs(gameId: string): Promise<TabWithRefills[]> {
    return this.repo.listTabsByGame(gameId);
  }

  public getGameSummary(gameId: string): Promise<GameTabsSummary> {
    return this.repo.getGameSummary(gameId);
  }

  public async getTab(tabId: string): Promise<TabWithRefills> {
    return this.requireTab(tabId);
  }

  public async addRefill(tabId: string, input: Omit<CreateRefillInput, 'tab_id'>): Promise<Refill> {
    await this.requireTab(tabId);
    return this.repo.addRefill({ ...input, tab_id: tabId });
  }

  public async markRefillPaid(tabId: string, refillId: string): Promise<Refill> {
    const refill = await this.repo.findRefillById(tabId, refillId);
    if (!refill) {
      throw new HttpError(404, 'Recarga não encontrada nesta comanda.');
    }
    if (refill.payment_status === 'PAID') {
      throw new HttpError(422, 'Esta recarga já está paga.');
    }
    return this.repo.markRefillPaid(refillId);
  }

  public async checkout(tabId: string, method: PaymentMethod): Promise<GatewayPayment> {
    const tab = await this.requireTab(tabId);

    const openRefills   = tab.refills.filter((r) => r.payment_status === 'OPEN');
    const entryOwed     = tab.entry_status === 'PENDING' ? Number(tab.entry_fee) : 0;
    const refillsOwed   = openRefills.reduce((sum, r) => sum + Number(r.total_price), 0);
    const total         = entryOwed + refillsOwed;

    if (total <= 0) {
      throw new HttpError(422, 'Não há valor pendente nesta comanda.');
    }

    return this.repo.checkout(
      tabId,
      method,
      total,
      openRefills.map((r) => r.id),
    );
  }

  private async requireTab(tabId: string): Promise<TabWithRefills> {
    const tab = await this.repo.findTabById(tabId);
    if (!tab) {
      throw new HttpError(404, 'Comanda não encontrada.');
    }
    return tab;
  }
}
