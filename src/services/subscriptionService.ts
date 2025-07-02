import { v4 as uuidv4 } from 'uuid';
import { ISubscriptionRepository, SubscriptionCreateData } from '../types/ISubscriptionRepository';
import sender from '../utils/EmailSender';
import subscriptionSubject from '../utils/subscriptionSubject';
import EmailObserver from '../utils/emailObserver';
import { ISubscriptionService } from './SubscriptionService.interface';
import {NotFoundError, ConflictError, WeatherUpdateError} from '../errors/httpError';

class SubscriptionService implements ISubscriptionService {
  constructor(private repository: ISubscriptionRepository) {}

  async subscribe(email: string, city: string, frequency: 'hourly' | 'daily'): Promise<{
    message: string;
    confirmationToken: string;
  }> {
    const existing = await this.repository.findByEmail(email);
    if (existing) throw new ConflictError('Email already subscribed');

    const confirmationToken = uuidv4();
    const unsubscribeToken = uuidv4();
    const data: SubscriptionCreateData = {
      email,
      city,
      frequency,
      confirmationToken,
      unsubscribeToken,
      confirmed: false,
    };
    const subscription = await this.repository.create(data);

    await sender.sendConfirmationEmail(email, confirmationToken);

    return { message: 'Subscription created. Check your email for confirmation.', confirmationToken };
  }

  async confirmSubscription(confirmationToken: string): Promise<{
    message: string;
  }> {
    const subscription = await this.repository.findByConfirmationToken(confirmationToken);
    if (!subscription) throw new NotFoundError('Token not found');
    if (subscription.confirmed) throw new ConflictError('Already confirmed');

    subscription.confirmed = true;
    await this.repository.update(subscription);

    const observer = new EmailObserver(subscription.email, subscription.unsubscribeToken);
    await subscriptionSubject.registerObserver(observer, subscription.city, subscription.frequency);

    return { message: 'Subscription confirmed successfully' };
  }

  async unsubscribe(unsubscribeToken: string): Promise<{
    message: string;
  }> {
    const subscription = await this.repository.findByUnsubscribeToken(unsubscribeToken);
    if (!subscription) throw new NotFoundError('Token not found');

    await subscriptionSubject.removeObserver(
        new EmailObserver(subscription.email, subscription.unsubscribeToken),
        subscription.city
    );
    await this.repository.delete(subscription);

    return { message: 'Unsubscribed successfully' };
  }

  async sendWeatherUpdates(frequency: 'hourly' | 'daily'): Promise<void> {
    try {
      const subscriptions = await this.repository.findAllByFrequency(frequency);
      if (subscriptions.length === 0) return;

      const cities = [...new Set(subscriptions.map((sub) => sub.city))];
      for (const city of cities) {
        await subscriptionSubject.notifyObservers(city, frequency);
      }
    } catch (error) {
      throw new WeatherUpdateError(
          `Failed to send weather updates for ${frequency}`,
          { error: error instanceof Error ? error.message : 'Unknown error', stack: (error as Error)?.stack }
      );
    }
  }
}

export default SubscriptionService;