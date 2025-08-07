// Domain interfaces
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IEmailService } from '../../domain/repositories/IEmailService';
import { IMessageBroker } from '../../domain/repositories/IMessageBroker';

// Use cases
import {
  SendNotificationUseCase,
  ProcessNotificationUseCase,
  ProcessPendingNotificationsUseCase
} from '../../application/use-cases';

// Infrastructure implementations
import { InMemoryNotificationRepository } from '../repositories/InMemoryNotificationRepository';
import { SendGridEmailService } from '../services/SendGridEmailService';
import { RabbitMQBroker } from '../messaging/RabbitMQBroker';

export interface NotificationContainer {
  notificationRepository: INotificationRepository;
  emailService: IEmailService;
  messageBroker: IMessageBroker;
  sendNotificationUseCase: SendNotificationUseCase;
  processNotificationUseCase: ProcessNotificationUseCase;
  processPendingNotificationsUseCase: ProcessPendingNotificationsUseCase;
}

export interface NotificationConfig {
  rabbitmqUrl: string;
  emailProvider: 'console' | 'smtp' | 'sendgrid';
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  sendgridApiKey?: string;
  processingIntervalMs: number;
}

export function createNotificationContainer(config: NotificationConfig): NotificationContainer {
  // Create repository instances
  const notificationRepository: INotificationRepository = new InMemoryNotificationRepository();
  const emailService: IEmailService = new SendGridEmailService();
  const messageBroker: IMessageBroker = new RabbitMQBroker(config.rabbitmqUrl);

  // Create use cases with dependencies
  const sendNotificationUseCase = new SendNotificationUseCase(notificationRepository);
  const processNotificationUseCase = new ProcessNotificationUseCase(notificationRepository, emailService);
  const processPendingNotificationsUseCase = new ProcessPendingNotificationsUseCase(
    notificationRepository,
    processNotificationUseCase
  );

  return {
    notificationRepository,
    emailService,
    messageBroker,
    sendNotificationUseCase,
    processNotificationUseCase,
    processPendingNotificationsUseCase
  };
}
