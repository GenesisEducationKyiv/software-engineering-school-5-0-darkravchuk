import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../infrastructure/logging/logger';
import { metricsCollector } from '../../infrastructure/metrics/metrics';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
}

export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction) {
  req.startTime = Date.now();
  next();
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json;
  res.json = function(this: Response, body: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    metricsCollector.recordRequest(req.method, req.path, res.statusCode, responseTime);
    logger.logRequest(req, res, responseTime);
    return originalJson.call(this, body);
  } as any;
  next();
}

