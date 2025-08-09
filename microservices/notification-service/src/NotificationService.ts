import express from 'express';
import cors from 'cors';
import { logger } from './infrastructure/logging/logger';
import { metricsCollector } from './infrastructure/metrics/metrics';
import { correlationIdMiddleware, requestTimingMiddleware, metricsMiddleware } from './presentation/middleware/observability';
import { NotificationController } from './presentation/controllers';
import { createNotificationContainer, NotificationConfig } from './infrastructure/container';
import { 
  SubscriptionCreatedHandler,
  DailyWeatherHandler
} from './infrastructure/handlers';
import {IMessageBroker} from './domain/repositories';

export class NotificationService {
  private app: express.Application;
  private container: any;
  private processingInterval?: NodeJS.Timeout;

  constructor(private config: NotificationConfig) {
    this.app = express();
    this.container = createNotificationContainer(config);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(correlationIdMiddleware);
    this.app.use(requestTimingMiddleware);
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(metricsMiddleware);
  }

  private setupRoutes(): void {
    const notificationController = new NotificationController(
      this.container.sendNotificationUseCase,
      this.container.notificationRepository
    );

    this.app.post('/api/notifications', notificationController.sendNotification);
    this.app.get('/api/notifications/stats', notificationController.getNotificationStats);
    this.app.get('/api/notifications/:id', notificationController.getNotification);

    this.app.get('/health', notificationController.healthCheck);
    this.app.get('/metrics', (req, res) => {
      res.json({ timestamp: new Date().toISOString(), ...metricsCollector.getMetrics() });
    });

    this.app.use('/*any', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: error.message, stack: error.stack, correlationId: (req as any).correlationId });
      res.status(500).json({ success: false, error: 'Internal server error' });
    });
  }

  public async start(port: number = 3003): Promise<void> {
    try {
      await this.setupMessageBroker();

      this.app.listen(port, () => {
        logger.info('Notification Service started', { port, env: process.env.NODE_ENV || 'development', sampling: process.env.LOG_SAMPLING_RATE || '1.0' });
      });

      this.startBackgroundProcessing();

    } catch (error) {
      logger.error('Failed to start Notification Service', { error: (error as any)?.message });
      throw error;
    }
  }

  private async setupMessageBroker(): Promise<void> {
    const messageBroker = this.container.messageBroker as IMessageBroker;
    
    try {
      await messageBroker.connect();

      const subscriptionCreatedHandler = new SubscriptionCreatedHandler(
        this.container.sendNotificationUseCase
      );
      const dailyWeatherHandler = new DailyWeatherHandler(
        this.container.sendNotificationUseCase
      );

      await messageBroker.subscribe(
        'weather-events',
        'created-subscriptions',
        'subscription.created',
        subscriptionCreatedHandler
      );

      await messageBroker.subscribe(
        'weather-events',
        'notification-events',
        'weather.daily',
        dailyWeatherHandler
      );

      logger.info('RabbitMQ message broker setup complete');
    } catch (error) {
      logger.error('Failed to setup message broker', { error: (error as any)?.message });
      throw error;
    }
  }

  private startBackgroundProcessing(): void {
    this.processingInterval = setInterval(async () => {
      try {
        const result = await this.container.processPendingNotificationsUseCase.execute();
        if (result.processed > 0) {
          logger.info('Processed pending notifications', { processed: result.processed, successful: result.successful, failed: result.failed, skipped: result.skipped });
        }
      } catch (error) {
        logger.error('Error in background processing', { error: (error as any)?.message });
      }
    }, this.config.processingIntervalMs);

    logger.info('Background processing started', { intervalMs: this.config.processingIntervalMs });
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down Notification Service');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    try {
      await this.container.messageBroker.disconnect();
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', { error: (error as any)?.message });
    }

    logger.info('Notification Service shutdown complete');
  }

  public getApp(): express.Application {
    return this.app;
  }
}
