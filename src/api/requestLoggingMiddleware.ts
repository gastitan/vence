import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../infrastructure/logger.js';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestLoggingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = randomUUID();
  req.requestId = requestId;
  const start = Date.now();

  logger.info({
    msg: 'request_start',
    requestId,
    method: req.method,
    url: req.originalUrl ?? req.url,
  });

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logger.info({
      msg: 'request_finish',
      requestId,
      statusCode: res.statusCode,
      durationMs,
    });
  });

  next();
}
