import { IEventPublisher } from '../../domain/interfaces/DomainInterfaces';

export class RabbitMQEventPublisher implements IEventPublisher {
  private connection: any;
  private channel: any;
  private readonly exchangeName = 'weather_updates';

  constructor(private readonly connectionUrl: string) {}

  async connect(): Promise<void> {
    try {
      const amqp = require('amqplib');
      
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();
      
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
      
      console.log('RabbitMQ connected successfully');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  async publish(event: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized. Call connect() first.');
    }

    try {
      const routingKey = this.getRoutingKey(event.eventType);
      const message = Buffer.from(JSON.stringify(event));
      
      await this.channel.publish(
        this.exchangeName,
        routingKey,
        message,
        {
          persistent: true,
          timestamp: Date.now(),
          messageId: event.eventId,
          type: event.eventType
        }
      );

      console.log(`Published event ${event.eventType} with routing key ${routingKey}`);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('RabbitMQ disconnected');
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  private getRoutingKey(eventType: string): string {
    switch (eventType) {
      case 'WeatherUpdate':
        return 'weather.update';
      case 'ScheduleExecuted':
        return 'schedule.executed';
      default:
        return 'schedule.unknown';
    }
  }
}
