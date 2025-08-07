import 'reflect-metadata';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './infrastructure/database/connection';
import { subscriptionRoutes } from './presentation/routes/subscriptionRoutes';
import { errorHandler } from './presentation/middleware/errorHandler';
import { logger } from './infrastructure/logging/logger';
import { metricsCollector } from './infrastructure/metrics/metricsCollector';
import {
  correlationIdMiddleware,
  requestTimingMiddleware,
  enhancedRequestLogger,
  errorHandlingWithLogging
} from './presentation/middleware/observability';
import './infrastructure/di/container';

dotenv.config();

class SubscriptionServiceApp {
  private app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = parseInt(process.env.PORT || '3001', 10);

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(correlationIdMiddleware);
    this.app.use(requestTimingMiddleware);
    
    this.app.use(helmet());
    
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
      exposedHeaders: ['x-correlation-id'],
      credentials: true
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(enhancedRequestLogger);
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      const healthData = {
        service: 'subscription-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: process.uptime()
      };

      logger.debug('Health check requested', {
        correlationId: req.correlationId,
        uptime: healthData.uptime
      });

      res.status(200).json(healthData);
    });

    this.app.get('/metrics', (req, res) => {
      const metrics = metricsCollector.getMetrics();
      
      logger.info('Metrics requested', {
        correlationId: req.correlationId,
        requestedBy: req.ip,
        totalRequests: metrics.requests.total
      });
      
      res.json({
        timestamp: new Date().toISOString(),
        ...metrics
      });
    });

    this.app.use('/api/v1/subscriptions', subscriptionRoutes);

    this.app.get('/api/v1', (req, res) => {
      const apiInfo = {
        message: 'Subscription Service API v1',
        endpoints: {
          health: 'GET /health',
          metrics: 'GET /metrics',
          subscriptions: 'POST /api/v1/subscriptions',
          confirm: 'POST /api/v1/subscriptions/confirm/:token',
          unsubscribe: 'DELETE /api/v1/subscriptions/unsubscribe/:token',
          getSubscriptions: 'GET /api/v1/subscriptions'
        },
        observability: {
          logging: 'Winston with structured logging and sampling',
          metrics: 'Custom metrics collection',
          correlationId: 'Request tracking support'
        }
      };

      logger.info('API info requested', {
        correlationId: req.correlationId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      res.status(200).json(apiInfo);
    });

    this.app.use('/*any', (req, res) => {
      logger.warn('Endpoint not found', {
        path: req.originalUrl,
        method: req.method,
        correlationId: req.correlationId,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        },
        path: req.originalUrl,
        method: req.method,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString()
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandlingWithLogging);
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting Subscription Service initialization');
      
      await initializeDatabase();
      logger.info('Database connection established');

      this.app.listen(this.port, () => {
        logger.info('Subscription Service started successfully', {
          port: this.port,
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          logSamplingRate: process.env.LOG_SAMPLING_RATE || '1.0',
          endpoints: {
            health: `http://localhost:${this.port}/health`,
            metrics: `http://localhost:${this.port}/metrics`,
            api: `http://localhost:${this.port}/api/v1`
          },
          observability: {
            loggingEnabled: true,
            metricsEnabled: true,
            correlationIdEnabled: true
          }
        });
      });

    } catch (error) {
      logger.error('Failed to start Subscription Service', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      process.exit(1);
    }
  }
}

const app = new SubscriptionServiceApp();
app.start().catch(error => {
  logger.error('Application startup failed', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  process.exit(1);
});
