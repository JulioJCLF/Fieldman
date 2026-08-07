import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

import { failure } from './api.js';
import { HttpError } from './errors.js';

function firstZodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? 'Dados inv\u00e1lidos.';
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json(failure(firstZodMessage(error)));
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json(failure(error.message));
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json(failure('O corpo da solicita\u00e7\u00e3o deve ser um JSON v\u00e1lido.'));
    return;
  }

  console.error('Unhandled API error', error);
  response.status(500).json(failure('N\u00e3o foi poss\u00edvel concluir a solicita\u00e7\u00e3o.'));
};
