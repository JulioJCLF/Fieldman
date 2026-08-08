import { z } from 'zod';

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),

  // Gateway de pagamento (Mercado Pago). Em 'mock', o fluxo PIX funciona sem
  // credencial real (útil para desenvolvimento). Em 'live', exige o access token.
  PAYMENTS_MODE: z.enum(['mock', 'live']).default('mock'),
  MERCADOPAGO_ACCESS_TOKEN: z.string().optional(),
  // URL pública do backend para o webhook do Mercado Pago (ex: túnel ngrok).
  PUBLIC_BASE_URL: z.string().url().optional(),
}).superRefine((env, ctx) => {
  if (env.PAYMENTS_MODE === 'live' && !env.MERCADOPAGO_ACCESS_TOKEN) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['MERCADOPAGO_ACCESS_TOKEN'],
      message: 'MERCADOPAGO_ACCESS_TOKEN é obrigatório quando PAYMENTS_MODE=live.',
    });
  }
});

export type Environment = z.infer<typeof environmentSchema>;

export function loadEnvironment(source: NodeJS.ProcessEnv = process.env): Environment {
  const parsed = environmentSchema.safeParse(source);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid server environment: ${details}`);
  }

  return parsed.data;
}
