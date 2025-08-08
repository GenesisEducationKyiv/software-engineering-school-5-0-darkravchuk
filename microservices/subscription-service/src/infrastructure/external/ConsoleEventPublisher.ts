import { injectable } from 'inversify';
import { IEventPublisher, DomainEvent } from '../../domain/services/IEventPublisher';

@injectable()
export class ConsoleEventPublisher implements IEventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    try {
      console.log(`[EVENT] ${event.eventType}:`, {
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt,
        version: event.version,
        data: this.extractEventData(event)
      });

      await this.simulateAsyncPublishing();
      
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw new Error(`Failed to publish event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    try {
      console.log(`[BATCH EVENTS] Publishing ${events.length} events`);
      
      for (const event of events) {
        await this.publish(event);
      }
      
      console.log(`[BATCH EVENTS] Successfully published ${events.length} events`);
    } catch (error) {
      console.error('Failed to publish batch events:', error);
      throw new Error(`Failed to publish batch events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractEventData(event: DomainEvent): any {
    const data: any = {};
    
    for (const key in event) {
      if (key !== 'eventType' && 
          key !== 'aggregateId' && 
          key !== 'occurredAt' && 
          key !== 'version') {
        data[key] = (event as any)[key];
      }
    }
    
    return data;
  }

  private async simulateAsyncPublishing(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}