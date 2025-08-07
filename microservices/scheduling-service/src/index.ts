import dotenv from 'dotenv';
import { DependencyContainer } from './container/DependencyContainer';
import { logger } from './infrastructure/logging/logger';
import { metricsCollector } from './infrastructure/metrics/metrics';

dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  weatherServiceUrl: process.env.WEATHER_SERVICE_URL || 'http://weather-service:3001',
  rabbitMqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  nodeEnv: process.env.NODE_ENV || 'development'
};

logger.info('Starting Scheduling Service', { config });

async function startService(): Promise<void> {
  let container: DependencyContainer | undefined;

  try {
    container = new DependencyContainer({
      weatherServiceUrl: config.weatherServiceUrl,
      rabbitMqUrl: config.rabbitMqUrl
    });

    await container.initialize();

    container.expressApp.listen(config.port);

    container.cronScheduler.start();

    logger.info('Scheduling Service started successfully');
    logger.debug('Cron scheduler running');

  } catch (error) {
    logger.error('Failed to start Scheduling Service', { error });
    
    if (container) {
      await container.cleanup();
    }
    
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    logger.warn('Shutdown signal received', { signal });
    
    if (container) {
      await container.cleanup();
    }
    
    logger.info('Scheduling Service shut down complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', { error });
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise: String(promise) });
    shutdown('unhandledRejection');
  });
}

startService().catch((error) => {
  logger.error('Fatal error starting service', { error });
  process.exit(1);
});
