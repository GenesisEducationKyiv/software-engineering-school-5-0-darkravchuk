import { IEventPublisher, DomainEvent } from '../../domain/services/IEventPublisher';
import { RabbitMQEventPublisher } from './RabbitMQEventPublisher';
import { SubscriptionCreatedEvent } from '../../domain/events/SubscriptionEvents';

export class RabbitMQEventPublisherAdapter implements IEventPublisher {
  constructor(
    private readonly rabbitMQPublisher: RabbitMQEventPublisher
  ) {}

  async publish(event: DomainEvent): Promise<void> {
    switch (event.eventType) {
    case 'SubscriptionCreated':
      const createdEvent = event as SubscriptionCreatedEvent;
      await this.rabbitMQPublisher.publishSubscriptionCreated({
        subscriptionId: createdEvent.aggregateId,
        email: createdEvent.email,
        city: createdEvent.city,
        createdAt: createdEvent.occurredAt.toISOString()
      });
      break;

    default:
      console.warn(`Unknown event type: ${event.eventType}`);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
