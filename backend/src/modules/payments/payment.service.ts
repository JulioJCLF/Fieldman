import { HttpError } from '../../shared/errors.js';
import type { TabsRepository } from '../tabs/tab.types.js';
import type {
  GatewayPayment,
  PaymentGatewayPort,
  PaymentsRepository,
  PixCharge,
} from './payment.types.js';

/** E-mail padrão do comprador quando o jogador não tem e-mail associado à comanda. */
const DEFAULT_PAYER_EMAIL = 'comprador@fieldman.local';

export interface PaymentServicePort {
  createPixForTab(tabId: string): Promise<PixCharge>;
  getStatus(paymentId: string): Promise<GatewayPayment>;
  handleWebhook(gatewayPaymentId: string): Promise<void>;
}

export class PaymentService implements PaymentServicePort {
  public constructor(
    private readonly repo: PaymentsRepository,
    private readonly gateway: PaymentGatewayPort,
    private readonly tabsRepo: TabsRepository,
  ) {}

  public async createPixForTab(tabId: string): Promise<PixCharge> {
    const tab = await this.tabsRepo.findTabById(tabId);
    if (!tab) {
      throw new HttpError(404, 'Comanda não encontrada.');
    }

    const { total } = this.pendingTotal(tab);
    if (total <= 0) {
      throw new HttpError(422, 'Não há valor pendente nesta comanda.');
    }

    const result = await this.gateway.createPix({
      amount:            total,
      description:       `Fieldman · comanda ${tab.player_name}`,
      externalReference: tabId,
      payerEmail:        DEFAULT_PAYER_EMAIL,
    });

    const payment = await this.repo.createPending({
      tab_id:                 tabId,
      amount:                 total,
      method:                 'PIX',
      gateway_transaction_id: result.gatewayPaymentId,
      status:                 result.status,
    });

    return {
      payment_id:     payment.id,
      status:         payment.status,
      amount:         total,
      qr_code:        result.qrCode,
      qr_code_base64: result.qrCodeBase64,
      ticket_url:     result.ticketUrl,
      expires_at:     result.expiresAt,
    };
  }

  public async getStatus(paymentId: string): Promise<GatewayPayment> {
    const payment = await this.repo.findById(paymentId);
    if (!payment) {
      throw new HttpError(404, 'Pagamento não encontrado.');
    }

    if (payment.status === 'APPROVED' || payment.status === 'REFUNDED') {
      return payment;
    }

    if (!payment.gateway_transaction_id) {
      return payment;
    }

    const snapshot = await this.gateway.getPayment(payment.gateway_transaction_id);
    if (snapshot.status === payment.status) {
      return payment;
    }

    if (snapshot.status === 'APPROVED') {
      return this.reconcileApproved(payment);
    }

    return this.repo.updateStatus(payment.id, snapshot.status);
  }

  public async handleWebhook(gatewayPaymentId: string): Promise<void> {
    const payment = await this.repo.findByGatewayTxId(gatewayPaymentId);
    if (!payment) {
      // Notificação de um pagamento que não conhecemos — ignora silenciosamente.
      return;
    }

    if (payment.status === 'APPROVED') {
      return;
    }

    const snapshot = await this.gateway.getPayment(gatewayPaymentId);
    if (snapshot.status === 'APPROVED') {
      await this.reconcileApproved(payment);
      return;
    }

    if (snapshot.status !== payment.status) {
      await this.repo.updateStatus(payment.id, snapshot.status);
    }
  }

  /** Marca o pagamento como aprovado e liquida a comanda (entrada + recargas em aberto). */
  private async reconcileApproved(payment: GatewayPayment): Promise<GatewayPayment> {
    const tab = await this.tabsRepo.findTabById(payment.tab_id);
    if (tab) {
      const openRefillIds = tab.refills.filter((r) => r.payment_status === 'OPEN').map((r) => r.id);
      await this.tabsRepo.settleTab(payment.tab_id, openRefillIds);
    }
    return this.repo.updateStatus(payment.id, 'APPROVED');
  }

  private pendingTotal(tab: { entry_status: string; entry_fee: number; refills: Array<{ payment_status: string; total_price: number }> }): { total: number } {
    const entryOwed   = tab.entry_status === 'PENDING' ? Number(tab.entry_fee) : 0;
    const refillsOwed = tab.refills
      .filter((r) => r.payment_status === 'OPEN')
      .reduce((sum, r) => sum + Number(r.total_price), 0);
    return { total: Math.round((entryOwed + refillsOwed) * 100) / 100 };
  }
}
