import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../infrastructure/logging/logger';
import { metricsCollector } from '../../infrastructure/metrics/metricsCollector';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
    }
  }
}

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  
  res.setHeader('x-correlation-id', req.correlationId);
  
  logger.debug('Correlation ID assigned', {
    correlationId: req.correlationId,
    method: req.method,
    url: req.url
  });
  
  next();
}

export function requestTimingMiddleware(req: Request, res: Response, next: NextFunction) {
  req.startTime = Date.now();
  next();
}

export function enhancedRequestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = req.startTime || Date.now();
  
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    correlationId: req.correlationId,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    body: req.method !== 'GET' && req.body ? {
      // Log sanitized body (remove sensitive data)
      ...req.body,
      email: req.body.email ? `${req.body.email.substring(0, 3)}***@***` : undefined
    } : undefined,
    params: Object.keys(req.params).length > 0 ? req.params : undefined,
    query: Object.keys(req.query).length > 0 ? req.query : undefined
  });

  const originalJson = res.json;
  res.json = function(this: Response, body: any) {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;

    metricsCollector.recordRequest(req.method, req.path, statusCode, responseTime);
    
    logger.logRequest(req, res, responseTime);
    
    if (process.env.NODE_ENV === 'development' && statusCode >= 400) {
      logger.debug('Error response body', {
        correlationId: req.correlationId,
        statusCode,
        body
      });
    }
    
    return originalJson.call(this, body);
  };

  next();
}

export function businessOperationLogger(operation: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    req.startTime = req.startTime || Date.now();
    
    logger.info(`Starting business operation: ${operation}`, {
      operation,
      correlationId: req.correlationId,
      method: req.method,
      url: req.url
    });

    const originalJson = res.json;
    res.json = function(this: Response, body: any) {
      const duration = Date.now() - (req.startTime || Date.now());
      const success = res.statusCode < 400;
      
      logger.logOperation(operation, success, {
        correlationId: req.correlationId,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        ...(body && body.data && { resultData: {
          subscriptionId: body.data.subscriptionId,
          email: body.data.email ? `${body.data.email.substring(0, 3)}***@***` : undefined,
          city: body.data.city,
          frequency: body.data.frequency
        }})
      });
      
      return originalJson.call(this, body);
    };

    next();
  };
}

export function errorHandlingWithLogging(err: any, req: Request, res: Response, next: NextFunction) {
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  
  const isValidationError = err.name === 'ValidationError' || err.code === 'VALIDATION_ERROR';
  const isBusinessError = err.code && err.code.startsWith('BUSINESS_');
  const statusCode = err.statusCode || (isValidationError ? 400 : (isBusinessError ? 422 : 500));
  
  const errorMeta = {
    error: err.message,
    errorCode: err.code,
    errorName: err.name,
    stack: err.stack,
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    responseTime,
    statusCode,
    ...(err.details && { errorDetails: err.details })
  };

  if (statusCode >= 500) {
    logger.error('Unhandled server error', errorMeta);
  } else if (statusCode >= 400) {
    logger.warn('Client error occurred', errorMeta);
  }
  
  metricsCollector.recordRequest(req.method, req.path, statusCode, responseTime);
  
  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      },
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

export function externalServiceLogger(serviceName: 'email' | 'weather' | 'eventPublisher') {
  return {
    logCall: (operation: string, success: boolean, duration?: number, meta: any = {}) => {
      metricsCollector.recordExternalServiceCall(serviceName, success);
      
      logger.logExternalCall(serviceName, operation, success, duration, meta);
    }
  };
}
