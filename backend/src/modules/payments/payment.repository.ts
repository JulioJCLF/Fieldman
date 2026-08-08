import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreatePendingPaymentInput,
  GatewayPayment,
  PaymentGwStatus,
  PaymentMethod,
  PaymentsRepository,
} from './payment.types.js';

interface GatewayPaymentRow {
  id: string;
  tab_id: string;
  gateway_transaction_id: string | null;
  method: PaymentMethod;
  amount: string;
  status: PaymentGwStatus;
  created_at: string;
}

const columns = 'id, tab_id, gateway_transaction_id, method, amount, status, created_at';

function toPayment(row: GatewayPaymentRow): GatewayPayment {
  return { ...row, amount: Number(row.amount) };
}

export class SupabasePaymentsRepository implements PaymentsRepository {
  public constructor(private readonly supabase: SupabaseClient) {}

  public async createPending(input: CreatePendingPaymentInput): Promise<GatewayPayment> {
    const { data, error } = await this.supabase
      .from('gateway_payments')
      .insert({
        tab_id:                 input.tab_id,
        amount:                 input.amount,
        method:                 input.method,
        gateway_transaction_id: input.gateway_transaction_id,
        status:                 input.status,
      })
      .select(columns)
      .single();

    if (error) throw error;
    return toPayment(data as GatewayPaymentRow);
  }

  public async findById(id: string): Promise<GatewayPayment | null> {
    const { data, error } = await this.supabase
      .from('gateway_payments')
      .select(columns)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? toPayment(data as GatewayPaymentRow) : null;
  }

  public async findByGatewayTxId(gatewayTxId: string): Promise<GatewayPayment | null> {
    const { data, error } = await this.supabase
      .from('gateway_payments')
      .select(columns)
      .eq('gateway_transaction_id', gatewayTxId)
      .maybeSingle();

    if (error) throw error;
    return data ? toPayment(data as GatewayPaymentRow) : null;
  }

  public async updateStatus(id: string, status: PaymentGwStatus): Promise<GatewayPayment> {
    const { data, error } = await this.supabase
      .from('gateway_payments')
      .update({ status })
      .eq('id', id)
      .select(columns)
      .single();

    if (error) throw error;
    return toPayment(data as GatewayPaymentRow);
  }
}
