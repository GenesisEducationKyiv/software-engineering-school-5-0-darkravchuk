import express from 'express';
import cors from 'cors';
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
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
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
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  }

  public async start(port: number = 3003): Promise<void> {
    try {
      await this.setupMessageBroker();

      this.app.listen(port, () => {
        console.log(`Notification Service is running on port ${port}`);
        console.log(`Health check: http://localhost:${port}/health`);
        console.log(`Send notification: POST http://localhost:${port}/api/notifications`);
      });

      // Start background processing
      this.startBackgroundProcessing();

    } catch (error) {
      console.error('Failed to start Notification Service:', error);
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

      console.log('RabbitMQ message broker setup complete');
    } catch (error) {
      console.error('Failed to setup message broker:', error);
      throw error;
    }
  }

  private startBackgroundProcessing(): void {
    this.processingInterval = setInterval(async () => {
      try {
        const result = await this.container.processPendingNotificationsUseCase.execute();
        
        if (result.processed > 0) {
          console.log(`Processed ${result.processed} notifications: ${result.successful} successful, ${result.failed} failed, ${result.skipped} skipped`);
        }
      } catch (error) {
        console.error('Error in background processing:', error);
      }
    }, this.config.processingIntervalMs);

    console.log(`Background processing started (interval: ${this.config.processingIntervalMs}ms)`);
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down Notification Service...');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    try {
      await this.container.messageBroker.disconnect();
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }

    console.log('Notification Service shutdown complete');
  }

  public getApp(): express.Application {
    return this.app;
  }
}
