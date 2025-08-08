import 'reflect-metadata';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeDatabase } from './infrastructure/database/connection';
import { subscriptionRoutes } from './presentation/routes/subscriptionRoutes';
import { errorHandler } from './presentation/middleware/errorHandler';
import { requestLogger } from './presentation/middleware/requestLogger';
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
    this.app.use(helmet());
    
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    }));

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    this.app.use(requestLogger);
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        service: 'subscription-service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    this.app.use('/api/v1/subscriptions', subscriptionRoutes);

    this.app.get('/api/v1', (req, res) => {
      res.status(200).json({
        message: 'Subscription Service API v1',
        endpoints: {
          health: 'GET /health',
          subscriptions: 'POST /api/v1/subscriptions',
          confirm: 'POST /api/v1/subscriptions/confirm/:token',
          unsubscribe: 'DELETE /api/v1/subscriptions/unsubscribe/:token'
        }
      });
    });

    this.app.use('/*any', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Endpoint not found'
        },
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      await initializeDatabase();

      this.app.listen(this.port, () => {
        console.log(`Subscription Service running on port ${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

    } catch (error) {
      console.error('Failed to start Subscription Service:', error);
      process.exit(1);
    }
  }
}

const app = new SubscriptionServiceApp();
app.start().catch(error => {
  console.error('Application startup failed:', error);
  process.exit(1);
});
