import * as amqp from 'amqplib';
import { IMessageBroker, MessageHandler } from '../../domain/repositories/IMessageBroker';
import { logger } from '../logging/logger';
import { metricsCollector } from '../metrics/metrics';

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

      this.connection.on('error', (error) => { logger.error('RabbitMQ connection error', { error }); });

      this.connection.on('close', () => { logger.warn('RabbitMQ connection closed'); });

      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error });
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

      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ', { error });
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
    metricsCollector.recordBroker('published');
    logger.debug('Message published to RabbitMQ', { exchange, routingKey });
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
        metricsCollector.recordBroker('consumed');
        logger.debug('Message consumed from RabbitMQ', { queue, routingKey });

      } catch (error) {
        logger.error(`Error processing message from queue ${queue}`, { error });
        metricsCollector.recordBroker('error');
        await this.nack(msg, false);
      }
    });

    logger.info('Subscribed to queue', { queue, routingKey });
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
