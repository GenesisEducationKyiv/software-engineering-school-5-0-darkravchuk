import { Notification } from '../../domain/entities/Notification';
import { EmailAddress } from '../../domain/value-objects/EmailAddress';
import { NotificationTemplate } from '../../domain/value-objects/NotificationTemplate';
import { NotificationMetadata } from '../../domain/value-objects/NotificationMetadata';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';

export interface SendNotificationRequest {
  recipient: string;
  templateType: 'welcome' | 'subscription_confirmed' | 'daily_weather' | 'custom';
  context: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresInMinutes?: number;
  customTemplate?: {
    subject: string;
    body: string;
  };
}

export interface SendNotificationResponse {
  notificationId: string;
  status: string;
  scheduledFor: Date;
}

export class SendNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(request: SendNotificationRequest): Promise<SendNotificationResponse> {

    this.validateRequest(request);

    const recipient = EmailAddress.fromString(request.recipient);
    const template = this.getTemplate(request);
    const metadata = this.createMetadata(request);

    const notificationId = this.generateNotificationId();

    const notification = Notification.create({
      id: notificationId,
      recipient,
      template,
      context: request.context,
      metadata
    });

    await this.notificationRepository.save(notification);

    return {
      notificationId,
      status: notification.status,
      scheduledFor: new Date()
    };
  }

  private validateRequest(request: SendNotificationRequest): void {
    if (!request.recipient) {
      throw new Error('Recipient email is required');
    }

    if (!EmailAddress.isValid(request.recipient)) {
      throw new Error('Invalid recipient email address');
    }

    if (!request.context || Object.keys(request.context).length === 0) {
      throw new Error('Context data is required');
    }

    if (request.templateType === 'custom' && !request.customTemplate) {
      throw new Error('Custom template is required when templateType is "custom"');
    }
  }

  private getTemplate(request: SendNotificationRequest): NotificationTemplate {
    switch (request.templateType) {
      case 'welcome':
        return NotificationTemplate.WELCOME_EMAIL;
      
      case 'subscription_confirmed':
        return NotificationTemplate.SUBSCRIPTION_CONFIRMED;
      
      case 'daily_weather':
        return NotificationTemplate.DAILY_WEATHER;
      
      case 'custom':
        if (!request.customTemplate) {
          throw new Error('Custom template is required');
        }
        return NotificationTemplate.create({
          type: 'email',
          subject: request.customTemplate.subject,
          body: request.customTemplate.body
        });
      
      default:
        throw new Error(`Unknown template type: ${request.templateType}`);
    }
  }

  private createMetadata(request: SendNotificationRequest): NotificationMetadata {
    const priority = request.priority || 'normal';
    
    if (request.expiresInMinutes) {
      const expiresAt = new Date(Date.now() + request.expiresInMinutes * 60 * 1000);
      return NotificationMetadata.create({
        priority,
        expiresAt,
        tags: [request.templateType]
      });
    }

    switch (priority) {
      case 'urgent':
        return NotificationMetadata.urgent();
      case 'high':
        return NotificationMetadata.realTime();
      case 'low':
        return NotificationMetadata.batch();
      default:
        return NotificationMetadata.create({
          priority,
          tags: [request.templateType]
        });
    }
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
