import { Notification } from '../../domain/entities/Notification';
import { INotificationRepository } from '../../domain/repositories/INotificationRepository';
import { IEmailService } from '../../domain/repositories/IEmailService';

export interface ProcessNotificationRequest {
  notificationId: string;
}

export interface ProcessNotificationResponse {
  success: boolean;
  status: string;
  deliveredAt?: Date;
  error?: string;
  willRetry?: boolean;
  nextRetryAt?: Date;
}

export class ProcessNotificationUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly emailService: IEmailService
  ) {}

  async execute(request: ProcessNotificationRequest): Promise<ProcessNotificationResponse> {
    const notification = await this.notificationRepository.findById(request.notificationId);
    
    if (!notification) {
      throw new Error(`Notification not found: ${request.notificationId}`);
    }

    try {
      notification.validateForDelivery();
      
      notification.markAsProcessing();
      await this.notificationRepository.update(notification);

      const content = notification.getRenderedContent();

      const deliveryResult = await this.emailService.sendEmail({
        to: notification.recipient,
        subject: content.subject,
        body: content.body,
        isHtml: true
      });

      if (deliveryResult.success) {
        notification.markAsSent();
        await this.notificationRepository.update(notification);

        return {
          success: true,
          status: notification.status,
          deliveredAt: deliveryResult.deliveredAt || new Date()
        };
      } else {
        const errorMessage = deliveryResult.error || 'Unknown delivery error';
        notification.markAsFailed(errorMessage);
        await this.notificationRepository.update(notification);

        return {
          success: false,
          status: notification.status,
          error: errorMessage,
          willRetry: notification.canBeRetried(),
          nextRetryAt: notification.nextRetryAt
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';
      
      try {
        notification.markAsFailed(errorMessage);
        await this.notificationRepository.update(notification);
      } catch {
        console.error('Failed to update notification status after error:', errorMessage);
      }

      return {
        success: false,
        status: notification.status,
        error: errorMessage,
        willRetry: notification.canBeRetried(),
        nextRetryAt: notification.nextRetryAt
      };
    }
  }
}
