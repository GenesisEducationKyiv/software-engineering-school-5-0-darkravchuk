import { injectable } from 'inversify';
import { IEventPublisher, DomainEvent } from '../../domain/services/IEventPublisher';

@injectable()
export class StubEventPublisher implements IEventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    console.log(`📝 Event published: ${event.eventType}`, {
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt.toISOString(),
      version: event.version
    });
    
    // TODO: Replace with RabbitMQ publisher once type issues are resolved
    // For now, just log the event
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
