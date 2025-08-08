export interface MessageHandler<T = any> {
  handle(message: T): Promise<void>;
}

export interface IMessageBroker {

  publish<T>(exchange: string, routingKey: string, message: T): Promise<void>;
  publishBatch<T>(exchange: string, messages: Array<{ routingKey: string; message: T }>): Promise<void>;
  
  subscribe<T>(
    exchange: string,
    queue: string,
    routingKey: string,
    handler: MessageHandler<T>
  ): Promise<void>;
  
  createQueue(queueName: string, options?: {
    durable?: boolean;
    exclusive?: boolean;
    autoDelete?: boolean;
  }): Promise<void>;
  
  createExchange(exchangeName: string, type: 'direct' | 'topic' | 'fanout', options?: {
    durable?: boolean;
  }): Promise<void>;
  
  bindQueue(queue: string, exchange: string, routingKey: string): Promise<void>;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  
  ack(message: any): Promise<void>;
  nack(message: any, requeue?: boolean): Promise<void>;
}
