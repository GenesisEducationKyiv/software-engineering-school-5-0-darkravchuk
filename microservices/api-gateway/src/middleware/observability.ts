import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { metricsCollector } from '../utils/metrics';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      startTime?: number;
      serviceName?: string;
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

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(this: Response, body: any) {
    const responseTime = req.startTime ? Date.now() - req.startTime : 0;
    const serviceName = extractServiceName(req.path);
    
    metricsCollector.recordRequest(
      req.method,
      req.path,
      res.statusCode,
      responseTime,
      serviceName
    );
    
    logger.logRequest(req, res, responseTime);
    
    return originalSend.call(this, body);
  };
  
  next();
}

export function errorHandlingMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  const responseTime = req.startTime ? Date.now() - req.startTime : 0;
  const serviceName = extractServiceName(req.path);
  
  logger.error('Unhandled error in API Gateway', {
    error: err.message,
    stack: err.stack,
    correlationId: req.correlationId,
    method: req.method,
    url: req.url,
    responseTime,
    serviceName
  });
  
  metricsCollector.recordRequest(
    req.method,
    req.path,
    500,
    responseTime,
    serviceName
  );
  
  if (!res.headersSent) {
    res.status(500).json({
      error: 'Internal server error',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
}

export function proxyLoggingMiddleware(serviceName: string) {
  return {
    onProxyReq: (proxyReq: any, req: Request, res: Response) => {
      req.serviceName = serviceName;
      
      logger.logProxy('request', serviceName, req);
      
      // Add correlation ID to proxied request
      if (req.correlationId) {
        proxyReq.setHeader('x-correlation-id', req.correlationId);
      }
      
      logger.debug('Proxy request details', {
        correlationId: req.correlationId,
        service: serviceName,
        method: req.method,
        originalUrl: req.originalUrl,
        targetUrl: proxyReq.path,
        headers: Object.fromEntries(
          Object.entries(req.headers).filter(([key]) => 
            ['authorization', 'content-type', 'user-agent', 'x-correlation-id'].includes(key.toLowerCase())
          )
        )
      });
    },
    
    onProxyRes: (proxyRes: any, req: Request, res: Response) => {
      logger.logProxy('response', serviceName, req, proxyRes);
      
      // Record service health based on response
      const isHealthy = proxyRes.statusCode < 500;
      metricsCollector.recordServiceHealth(serviceName, isHealthy);
      
      logger.debug('Proxy response details', {
        correlationId: req.correlationId,
        service: serviceName,
        statusCode: proxyRes.statusCode,
        responseHeaders: Object.fromEntries(
          Object.entries(proxyRes.headers).filter(([key]) => 
            ['content-type', 'content-length', 'x-correlation-id'].includes(key.toLowerCase())
          )
        )
      });
    },
    
    onError: (err: any, req: Request, res: Response) => {
      logger.logProxy('request', serviceName, req, undefined, err);
      
      // Mark service as unhealthy
      metricsCollector.recordServiceHealth(serviceName, false);
      
      logger.error('Proxy error occurred', {
        correlationId: req.correlationId,
        service: serviceName,
        error: err.message,
        stack: err.stack,
        method: req.method,
        url: req.url
      });
      
      if (!res.headersSent) {
        res.status(503).json({
          error: `${serviceName} service unavailable`,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString()
        });
      }
    }
  };
}

function extractServiceName(path: string): string | undefined {
  if (path.includes('/subscriptions')) return 'subscription-service';
  if (path.includes('/weather')) return 'weather-service';
  if (path.includes('/schedules')) return 'scheduling-service';
  if (path.includes('/notifications')) return 'notification-service';
  return undefined;
}
