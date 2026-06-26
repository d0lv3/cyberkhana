import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  res.locals.requestId = requestId;

  logger.info('http.request.started', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent') || 'unknown',
  });

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const payload = {
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    };

    if (res.statusCode >= 500) {
      logger.error('http.request.finished', payload);
      return;
    }

    if (res.statusCode >= 400) {
      logger.warn('http.request.finished', payload);
      return;
    }

    logger.info('http.request.finished', payload);
  });

  next();
};
