import { INotificationRepository } from '../../domain/repositories';
import { ProcessNotificationUseCase } from './ProcessNotificationUseCase';

export interface ProcessPendingNotificationsResponse {
  processed: number;
  successful: number;
  failed: number;
  skipped: number;
}

export class ProcessPendingNotificationsUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly processNotificationUseCase: ProcessNotificationUseCase
  ) {}

  async execute(): Promise<ProcessPendingNotificationsResponse> {
    const pendingNotifications = await this.notificationRepository.findPendingForRetry();
    
    let successful = 0;
    let failed = 0;
    let skipped = 0;

    for (const notification of pendingNotifications) {
      try {
        if (!notification.isReadyForRetry()) {
          skipped++;
          continue;
        }

        if (notification.isExpired()) {
          notification.cancel('Expired');
          await this.notificationRepository.update(notification);
          skipped++;
          continue;
        }

        const result = await this.processNotificationUseCase.execute({
          notificationId: notification.id
        });

        if (result.success) {
          successful++;
        } else {
          failed++;
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        failed++;
      }
    }

    return {
      processed: pendingNotifications.length,
      successful,
      failed,
      skipped
    };
  }
}
