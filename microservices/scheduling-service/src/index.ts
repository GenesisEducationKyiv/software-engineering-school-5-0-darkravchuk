import dotenv from 'dotenv';
import { DependencyContainer } from './container/DependencyContainer';

dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '3003', 10),
  weatherServiceUrl: process.env.WEATHER_SERVICE_URL || 'http://weather-service:3001',
  rabbitMqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  nodeEnv: process.env.NODE_ENV || 'development'
};

console.log('Starting Scheduling Service...');
console.log('Configuration:', {
  port: config.port,
  weatherServiceUrl: config.weatherServiceUrl,
  rabbitMqUrl: config.rabbitMqUrl,
  nodeEnv: config.nodeEnv
});

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

    console.log('Scheduling Service started successfully!');
    console.log('Cron scheduler is running - weather updates will be processed automatically');

  } catch (error) {
    console.error('Failed to start Scheduling Service:', error);
    
    if (container) {
      await container.cleanup();
    }
    
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    
    if (container) {
      await container.cleanup();
    }
    
    console.log('Scheduling Service shut down complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

startService().catch((error) => {
  console.error('Fatal error starting service:', error);
  process.exit(1);
});
