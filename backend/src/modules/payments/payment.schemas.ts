import { z } from 'zod';

const uuidSchema = z.string().uuid('ID inválido.');

const createPixSchema = z.object({
  tab_id: uuidSchema,
}).strict();

export function parseCreatePix(body: unknown): { tabId: string } {
  return { tabId: createPixSchema.parse(body).tab_id };
}

export function parsePaymentId(input: unknown): string {
  return uuidSchema.parse(input);
}

/**
 * Extrai o id do pagamento do webhook do Mercado Pago. O MP envia o id tanto
 * no corpo (`data.id` / `resource`) quanto na query (`?data.id=`, `?id=`).
 * Retorna null quando a notificação não é sobre um pagamento.
 */
export function extractWebhookPaymentId(body: unknown, query: Record<string, unknown>): string | null {
  const type = (body as { type?: string })?.type ?? query['type'] ?? query['topic'];
  if (type && type !== 'payment') {
    return null;
  }

  const fromBody = (body as { data?: { id?: unknown } })?.data?.id;
  if (fromBody !== undefined && fromBody !== null) {
    return String(fromBody);
  }

  const fromQuery = query['data.id'] ?? query['id'];
  return fromQuery !== undefined && fromQuery !== null ? String(fromQuery) : null;
}
