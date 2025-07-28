import { v4 } from 'uuid';
import { ISubscriptionRepository, SubscriptionCreateData } from '../types/ISubscriptionRepository';
import { IEmailSender } from '../types/IEmailSender';
import { ISubscriptionSubject } from '../types/ISubscriptionSubject';
import EmailObserver from '../utils/emailObserver';
import { ISubscriptionService } from './SubscriptionService.interface';
import { NotFoundError, ConflictError, WeatherUpdateError } from '../errors/httpError';

class SubscriptionService implements ISubscriptionService {

  constructor(
      private repository: ISubscriptionRepository,
      private emailSender: IEmailSender,
      private subscriptionSubject: ISubscriptionSubject,
  ) {
  }

  private createEmailObserver(email: string, unsubscribeToken: string): EmailObserver {
    return new EmailObserver(email, unsubscribeToken, this.emailSender);
  }

  async subscribe(email: string, city: string, frequency: 'hourly' | 'daily'): Promise<{
    message: string;
  }> {
    const existing = await this.repository.findByEmail(email);
    if (existing) throw new ConflictError('Email already subscribed');

    const confirmationToken = v4();
    const unsubscribeToken = v4();
    const data: SubscriptionCreateData = {
      email,
      city,
      frequency,
      confirmationToken,
      unsubscribeToken,
      confirmed: false,
    };
    const subscription = await this.repository.create(data);

    await this.emailSender.sendConfirmationEmail(email, confirmationToken);

    return { message: 'Subscription created. Check your email for confirmation.' };
  }

  async confirmSubscription(confirmationToken: string): Promise<{
    message: string;
  }> {
    const subscription = await this.repository.findByConfirmationToken(confirmationToken);
    if (!subscription) throw new NotFoundError('Token not found');
    if (subscription.confirmed) throw new ConflictError('Already confirmed');

    subscription.confirmed = true;
    await this.repository.update(subscription);

    const observer = this.createEmailObserver(subscription.email, subscription.unsubscribeToken);
    await this.subscriptionSubject.registerObserver(observer, subscription.city, subscription.frequency);

    return { message: 'Subscription confirmed successfully' };
  }

  async unsubscribe(unsubscribeToken: string): Promise<{
    message: string;
  }> {
    const subscription = await this.repository.findByUnsubscribeToken(unsubscribeToken);
    if (!subscription) throw new NotFoundError('Token not found');

    const observer = this.createEmailObserver(subscription.email, subscription.unsubscribeToken);
    await this.subscriptionSubject.removeObserver(observer, subscription.city);
    await this.repository.delete(subscription);

    await this.emailSender.sendUnsubscribeEmail(subscription.email, unsubscribeToken);

    return { message: 'Unsubscribed successfully' };
  }

  async sendWeatherUpdates(frequency: 'hourly' | 'daily'): Promise<void> {
    try {
      const subscriptions = await this.repository.findAllByFrequency(frequency);
      if (subscriptions.length === 0) return;

      const cities = [...new Set(subscriptions.map((sub) => sub.city))];
      for (const city of cities) {
        await this.subscriptionSubject.notifyObservers(city, frequency);
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