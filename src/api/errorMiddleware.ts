import type { Request, Response, NextFunction } from 'express';
import {
  ApiError,
  InternalServerError,
  ValidationError,
  isApiError,
} from './errors.js';
import { logger } from '../infrastructure/logger.js';

function isProduction(): boolean {
  return (process.env.NODE_ENV ?? 'development') === 'production';
}

/**
 * Detects Zod validation errors (by name and shape) without requiring zod as dependency.
 * When Zod is used, its errors are mapped to ValidationError with details.
 */
function isZodError(err: unknown): err is { name: 'ZodError'; errors: unknown } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'name' in err &&
    (err as { name: string }).name === 'ZodError' &&
    'errors' in err
  );
}

function toStructuredError(err: unknown): { statusCode: number; body: ReturnType<ApiError['toResponseBody']> } {
  if (isApiError(err)) {
    return {
      statusCode: err.statusCode,
      body: err.toResponseBody(),
    };
  }

  if (isZodError(err)) {
    const validation = new ValidationError('Validation failed', err.errors);
    return {
      statusCode: validation.statusCode,
      body: validation.toResponseBody(),
    };
  }

  const prod = isProduction();
  const fallback = new InternalServerError(
    prod ? 'An unexpected error occurred' : err instanceof Error ? err.message : 'Unknown error',
    prod ? undefined : (err instanceof Error ? { stack: err.stack } : undefined)
  );
  return {
    statusCode: fallback.statusCode,
    body: fallback.toResponseBody(),
  };
}

/**
 * Global Express error middleware. Must be registered after all routes.
 * - Maps ApiError instances to their statusCode and structured body
 * - Maps ZodError to ValidationError (400)
 * - Unknown errors → 500, generic message in production, no stack leak
 * - Always returns { error: { code, message, details? } }
 */
export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId;
  logger.error({
    msg: 'unhandled_error',
    requestId,
    err: err instanceof Error ? { message: err.message, name: err.name, stack: err.stack } : err,
  });
  const { statusCode, body } = toStructuredError(err);
  res.status(statusCode).json(body);
}
