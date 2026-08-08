import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { failure } from '../../shared/api.js';

/**
 * Rotas acessíveis sem autenticação. O auto-cadastro público de jogador
 * (formulário em /register) precisa criar jogadores sem sessão de staff.
 */
interface PublicRoute {
  method: string;
  path: string;
}

const PUBLIC_ROUTES: PublicRoute[] = [
  // Auto-cadastro público de jogador (formulário em /register).
  { method: 'POST', path: '/api/players' },
  // Webhook do gateway de pagamento (chamada servidor-a-servidor, sem sessão).
  { method: 'POST', path: '/api/payments/webhook' },
];

function normalizedPath(request: Request): string {
  const path = request.originalUrl.split('?')[0]?.replace(/\/+$/, '');
  return path || '/';
}

function isPublicRoute(request: Request): boolean {
  const path = normalizedPath(request);
  return PUBLIC_ROUTES.some((route) => route.method === request.method && route.path === path);
}

function extractBearerToken(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }
  return token.trim();
}

/** Disponível para os controllers via `request.authUser`. */
export interface AuthenticatedRequest extends Request {
  authUser?: User;
}

/**
 * Cria o middleware que exige um JWT válido do Supabase Auth no header
 * Authorization. Valida o token contra o Supabase e anexa o usuário à request.
 */
export function createAuthMiddleware(supabase: SupabaseClient): RequestHandler {
  return async function requireAuth(request: Request, response: Response, next: NextFunction): Promise<void> {
    if (isPublicRoute(request)) {
      next();
      return;
    }

    const token = extractBearerToken(request.headers.authorization);
    if (!token) {
      response.status(401).json(failure('Autenticação necessária.'));
      return;
    }

    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) {
        response.status(401).json(failure('Sessão inválida ou expirada.'));
        return;
      }

      (request as AuthenticatedRequest).authUser = data.user;
      next();
    } catch (unexpected) {
      next(unexpected);
    }
  };
}
