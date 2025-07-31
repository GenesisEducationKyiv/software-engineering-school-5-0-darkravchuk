import Subscription from '../models/Subscription';
import { ISubscriptionRepository, SubscriptionCreateData } from '../interfaces/ISubscriptionRepository';

class SequelizeSubscriptionRepository implements ISubscriptionRepository {
  async findByEmail(email: string): Promise<Subscription | null> {
    return Subscription.findOne({ where: { email } });
  }

  async findByConfirmationToken(token: string): Promise<Subscription | null> {
    return Subscription.findOne({ where: { confirmationToken: token } });
  }

  async findByUnsubscribeToken(token: string): Promise<Subscription | null> {
    return Subscription.findOne({ where: { unsubscribeToken: token } });
  }

  async findAllByFrequency(frequency: 'hourly' | 'daily'): Promise<Subscription[]> {
    return Subscription.findAll({ where: { confirmed: true, frequency } });
  }

  async findOne(filter: { email: string; city: string; frequency: 'hourly' | 'daily'; confirmed: boolean }): Promise<Subscription | null> {
    return Subscription.findOne({ where: filter });
  }

  async create(data: SubscriptionCreateData): Promise<Subscription> {
    return Subscription.create(data);
  }

  async update(subscription: Subscription): Promise<Subscription> {
    return subscription.save();
  }

  async delete(subscription: Subscription): Promise<void> {
    await subscription.destroy();
  }

  async findAll(): Promise<Subscription[]> {
    return Subscription.findAll();
  }
}

export default SequelizeSubscriptionRepository;