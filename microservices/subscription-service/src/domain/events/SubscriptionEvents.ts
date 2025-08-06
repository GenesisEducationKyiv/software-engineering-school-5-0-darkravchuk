import { BaseDomainEvent } from '../services/IEventPublisher';

export class SubscriptionCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly city: string,
    public readonly frequency: string,
    public readonly confirmationToken: string
  ) {
    super('SubscriptionCreated', aggregateId);
  }
}

export class SubscriptionCancelledEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly city: string
  ) {
    super('SubscriptionCancelled', aggregateId);
  }
}
