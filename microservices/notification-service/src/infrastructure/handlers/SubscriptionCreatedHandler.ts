import { MessageHandler } from '../../domain/repositories/IMessageBroker';
import { SendNotificationUseCase } from '../../application/use-cases';
import { logger } from '../logging/logger';
import { metricsCollector } from '../metrics/metrics';

export interface SubscriptionCreatedEvent {
  confirmationToken: string;
  email: string;
  city: string;
  createdAt: string;
}

export class SubscriptionCreatedHandler implements MessageHandler<SubscriptionCreatedEvent> {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async handle(event: SubscriptionCreatedEvent): Promise<void> {
    logger.info('Processing subscription.created event', { email: event.email, city: event.city });

    try {
      await this.sendNotificationUseCase.execute({
        recipient: event.email,
        templateType: 'welcome',
        context: {
          name: event.email.split('@')[0],
          email: event.email,
          city: event.city,
          confirmationLink: `http://localhost:3001/api/subscriptions/confirm/${event.confirmationToken}`
        },
        priority: 'high'
      });
      metricsCollector.recordNotification('welcome', 'high', true);
      logger.debug('Welcome notification dispatched', { confirmationToken: event.confirmationToken });
    } catch (error) {
      metricsCollector.recordNotification('welcome', 'high', false);
      logger.error('Failed to send welcome notification', { error: (error as any)?.message });
      throw error;
    }
  }
}
