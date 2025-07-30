import {ISubscriptionRepository, SubscriptionCreateData} from '../../src/interfaces/ISubscriptionRepository';
import {ISubscription} from '../../src/interfaces/ISubscription';

export class MockSubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: ISubscription[] = [];
  private nextId: number = 1;

  async findByEmail(email: string): Promise<ISubscription | null> {
    return this.subscriptions.find((sub) => sub.email === email) || null;
  }

  async findByConfirmationToken(token: string): Promise<ISubscription | null> {
    return this.subscriptions.find((sub) => sub.confirmationToken === token) || null;
  }

  async findByUnsubscribeToken(token: string): Promise<ISubscription | null> {
    return this.subscriptions.find((sub) => sub.unsubscribeToken === token) || null;
  }

  async findAllByFrequency(frequency: 'hourly' | 'daily'): Promise<ISubscription[]> {
    return this.subscriptions.filter((sub) => sub.frequency === frequency);
  }

  async findOne(filter: { email: string; city: string; frequency: 'hourly' | 'daily'; confirmed: boolean }): Promise<ISubscription | null> {
    return (
      this.subscriptions.find(
        (sub) =>
          sub.email === filter.email &&
                    sub.city === filter.city &&
                    sub.frequency === filter.frequency &&
                    sub.confirmed === filter.confirmed
      ) || null
    );
  }

  async create(data: SubscriptionCreateData): Promise<ISubscription> {
    const subscription: ISubscription = {
      ...data,
      id: this.nextId++,
    };
    this.subscriptions.push(subscription);
    return subscription;
  }

  async update(subscription: ISubscription): Promise<ISubscription> {
    const index = this.subscriptions.findIndex((sub) => sub.id === subscription.id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }
    this.subscriptions[index] = { ...subscription };
    return this.subscriptions[index];
  }

  async delete(subscription: ISubscription): Promise<void> {
    const index = this.subscriptions.findIndex((sub) => sub.id === subscription.id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }
    this.subscriptions.splice(index, 1);
  }

  async findAll(): Promise<ISubscription[]> {
    return [...this.subscriptions];
  }
}