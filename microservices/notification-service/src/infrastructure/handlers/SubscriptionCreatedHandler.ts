import { MessageHandler } from '../../domain/repositories/IMessageBroker';
import { SendNotificationUseCase } from '../../application/use-cases';

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
    console.log('📬 Processing subscription.created event:', event);

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

      console.log('Welcome notification sent for subscription:', event.confirmationToken);
    } catch (error) {
      console.error('Failed to send welcome notification:', error);
      throw error;
    }
  }
}
