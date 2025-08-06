import * as amqp from 'amqplib';
import { IMessageBroker, MessageHandler } from '../../domain/repositories/IMessageBroker';

export class RabbitMQBroker implements IMessageBroker {
  private connection?: amqp.ChannelModel;
  private channel?: amqp.Channel;
  private readonly connectionUrl: string;

  constructor(connectionUrl: string = 'amqp://localhost:5672') {
    this.connectionUrl = connectionUrl;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.connectionUrl);
      this.channel = await this.connection.createChannel();

      this.connection.on('error', (error) => {
        console.error('RabbitMQ connection error:', error);
      });

      this.connection.on('close', () => {
        console.log('RabbitMQ connection closed');
      });

      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
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

      console.log('Disconnected from RabbitMQ');
    } catch (error) {
      console.error('Error disconnecting from RabbitMQ:', error);
    }
  }

  isConnected(): boolean {
    return !!(this.connection && this.channel);
  }

  async publish<T>(exchange: string, routingKey: string, message: T): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    const published = this.channel.publish(
      exchange,
      routingKey,
      messageBuffer,
      {
        persistent: true,
        timestamp: Date.now(),
        messageId: this.generateMessageId()
      }
    );

    if (!published) {
      throw new Error('Failed to publish message to RabbitMQ');
    }
  }

  async publishBatch<T>(
    exchange: string, 
    messages: Array<{ routingKey: string; message: T }>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    for (const { routingKey, message } of messages) {
      await this.publish(exchange, routingKey, message);
    }
  }

  async subscribe<T>(
    exchange: string,
    queue: string,
    routingKey: string,
    handler: MessageHandler<T>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.createExchange(exchange, 'topic', { durable: true });
    await this.createQueue(queue, { durable: true });
    await this.bindQueue(queue, exchange, routingKey);

    await this.channel.prefetch(1);

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = msg.content.toString();
        const message: T = JSON.parse(content);

        await handler.handle(message);
        await this.ack(msg);

      } catch (error) {
        console.error(`Error processing message from queue ${queue}:`, error);
        await this.nack(msg, false);
      }
    });

    console.log(`📬 Subscribed to queue: ${queue} (routing key: ${routingKey})`);
  }

  async createQueue(queueName: string, options?: {
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
  }): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.assertQueue(queueName, {
      durable: options?.durable ?? true,
      exclusive: options?.exclusive ?? false,
      autoDelete: options?.autoDelete ?? false
    });
  }

  async createExchange(
    exchangeName: string, 
    type: 'direct' | 'topic' | 'fanout',
    options?: { durable?: boolean }
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.assertExchange(exchangeName, type, {
      durable: options?.durable ?? true
    });
  }

  async bindQueue(queue: string, exchange: string, routingKey: string): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    await this.channel.bindQueue(queue, exchange, routingKey);
  }

  async ack(message: any): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    this.channel.ack(message as amqp.ConsumeMessage);
  }

  async nack(message: any, requeue: boolean = true): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    this.channel.nack(message as amqp.ConsumeMessage, false, requeue);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
