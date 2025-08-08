import { INotificationRepository } from '../../domain/repositories';
import { IEmailService } from '../../domain/repositories';
import { IMessageBroker } from '../../domain/repositories';

import {
  SendNotificationUseCase,
  ProcessNotificationUseCase,
  ProcessPendingNotificationsUseCase
} from '../../application/use-cases';

import { InMemoryNotificationRepository } from '../repositories/InMemoryNotificationRepository';
import { SendGridEmailService } from '../services/SendGridEmailService';
import { RabbitMQBroker } from '../messaging/RabbitMQBroker';
import {IEmailSender} from '../services/IEmailSender';
import {EmailSender} from '../services/EmailSender';
import {IEmailProvider} from '../services/IEmailProvider';
import {SendGridProvider} from '../services/emailProviders/SendGridProvider';

export interface NotificationContainer {
  notificationRepository: INotificationRepository;
  emailService: IEmailService;
  emailSender: IEmailSender;
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
  const notificationRepository: INotificationRepository = new InMemoryNotificationRepository();
  const emailService: IEmailService = new SendGridEmailService();
  const messageBroker: IMessageBroker = new RabbitMQBroker(config.rabbitmqUrl);

  const processNotificationUseCase = new ProcessNotificationUseCase(notificationRepository, emailService);
  const processPendingNotificationsUseCase = new ProcessPendingNotificationsUseCase(
    notificationRepository,
    processNotificationUseCase
  );
  const emailProvider: IEmailProvider = new SendGridProvider();
  const emailSender: IEmailSender = new EmailSender(emailProvider);
  const sendNotificationUseCase = new SendNotificationUseCase(emailSender);

  return {
    notificationRepository,
    emailService,
    emailSender,
    messageBroker,
    sendNotificationUseCase,
    processNotificationUseCase,
    processPendingNotificationsUseCase
  };
}
