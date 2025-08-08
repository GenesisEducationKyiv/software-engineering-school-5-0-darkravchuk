import { BaseDomainEvent } from '../services/IEventPublisher';

export class SubscriptionCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly city: string,
    public readonly confirmationToken: string
  ) {
    super('created', aggregateId);
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
