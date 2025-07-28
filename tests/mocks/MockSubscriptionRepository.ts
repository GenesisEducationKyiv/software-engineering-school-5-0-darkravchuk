import {ISubscriptionRepository, SubscriptionCreateData} from '../../src/types/ISubscriptionRepository';
import {Subscription} from '../../src/types/Subscription';

export class MockSubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Subscription[] = [];
  private nextId: number = 1;

  async findByEmail(email: string): Promise<Subscription | null> {
    return this.subscriptions.find((sub) => sub.email === email) || null;
  }

  async findByConfirmationToken(token: string): Promise<Subscription | null> {
    return this.subscriptions.find((sub) => sub.confirmationToken === token) || null;
  }

  async findByUnsubscribeToken(token: string): Promise<Subscription | null> {
    return this.subscriptions.find((sub) => sub.unsubscribeToken === token) || null;
  }

  async findAllByFrequency(frequency: 'hourly' | 'daily'): Promise<Subscription[]> {
    return this.subscriptions.filter((sub) => sub.frequency === frequency);
  }

  async findOne(filter: { email: string; city: string; frequency: 'hourly' | 'daily'; confirmed: boolean }): Promise<Subscription | null> {
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

  async create(data: SubscriptionCreateData): Promise<Subscription> {
    const subscription: Subscription = {
      ...data,
      id: this.nextId++,
    };
    this.subscriptions.push(subscription);
    return subscription;
  }

  async update(subscription: Subscription): Promise<Subscription> {
    const index = this.subscriptions.findIndex((sub) => sub.id === subscription.id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }
    this.subscriptions[index] = { ...subscription };
    return this.subscriptions[index];
  }

  async delete(subscription: Subscription): Promise<void> {
    const index = this.subscriptions.findIndex((sub) => sub.id === subscription.id);
    if (index === -1) {
      throw new Error('Subscription not found');
    }
    this.subscriptions.splice(index, 1);
  }

  async findAll(): Promise<Subscription[]> {
    return [...this.subscriptions];
  }
}