import { injectable } from 'inversify';
import * as amqp from 'amqplib';
import { IEventPublisher, DomainEvent } from '../../domain/services/IEventPublisher';

@injectable()
export class RabbitMQEventPublisher implements IEventPublisher {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private readonly connectionUrl: string;
  private readonly exchangeName: string = 'domain-events';

  constructor(connectionUrl: string = 'amqp://localhost:5672') {
    this.connectionUrl = connectionUrl;
  }

  async connect(): Promise<void> {
    try {
      // amqp.connect() returns a ChannelModel, not a Connection
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      // Create the domain events exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true
      });

      // Handle connection events
      this.connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
      });

      console.log('✅ Connected to RabbitMQ for domain events');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = undefined;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = undefined;
      }

      console.log('🔌 Disconnected from RabbitMQ');
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  async publish(event: DomainEvent): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const routingKey = `subscription.${event.eventType}`;
    const messageBuffer = Buffer.from(JSON.stringify({
      ...event,
      occurredAt: event.occurredAt.toISOString()
    }));

    console.log(`📢 Publishing domain event: ${event.eventType}`, {
      aggregateId: event.aggregateId,
      occurredAt: event.occurredAt.toISOString(),
      version: event.version,
      routingKey
    });
    
    const published = this.channel.publish(
      this.exchangeName,
      routingKey,
      messageBuffer,
      {
        persistent: true,
        timestamp: Date.now(),
        messageId: this.generateMessageId(),
        headers: {
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          version: event.version
        }
      }
    );

    if (!published) {
      throw new Error('Failed to publish domain event to RabbitMQ');
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  private generateMessageId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
