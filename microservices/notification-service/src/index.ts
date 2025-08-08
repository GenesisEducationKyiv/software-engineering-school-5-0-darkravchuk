import { NotificationService } from './NotificationService';
import { NotificationConfig } from './infrastructure/container';

const config: NotificationConfig = {
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  emailProvider: (process.env.EMAIL_PROVIDER as any) || 'console',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  processingIntervalMs: parseInt(process.env.PROCESSING_INTERVAL_MS || '5000', 10)
};

const notificationService = new NotificationService(config);
const port = parseInt(process.env.PORT || '3004', 10);

notificationService.start(port).catch(error => {
  console.error('Failed to start Notification Service:', error);
  process.exit(1);
});
