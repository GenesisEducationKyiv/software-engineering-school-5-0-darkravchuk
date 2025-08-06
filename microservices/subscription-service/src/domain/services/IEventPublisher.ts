export interface DomainEvent {
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly version: number;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly version: number = 1;

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string
  ) {
    this.occurredAt = new Date();
  }
}

export interface IEventPublisher {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): Promise<void>;
}
