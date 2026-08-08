export type PaymentGwStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

export interface PixCharge {
  payment_id: string;
  status: PaymentGwStatus;
  amount: number;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string | null;
  expires_at: string | null;
}

export interface GatewayPayment {
  id: string;
  tab_id: string;
  gateway_transaction_id: string | null;
  method: 'PIX' | 'CARD' | 'CASH';
  amount: number;
  status: PaymentGwStatus;
  created_at: string;
}
