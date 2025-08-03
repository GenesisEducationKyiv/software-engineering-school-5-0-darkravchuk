import { IObserver } from '../interfaces/IObserver';
import EmailObserver from './emailObserver';
import { IWeatherService } from '../services/WeatherService.interface';
import { IEmailSender } from '../interfaces/IEmailSender';
import { ISubscriptionSubject } from '../interfaces/ISubscriptionSubject';
import { ISubscriptionRepository } from '../interfaces/ISubscriptionRepository';
import sequelize from '../config/database';

class SubscriptionSubject implements ISubscriptionSubject {
  private weatherService: IWeatherService;
  private readonly emailSender: IEmailSender;
  private subscriptionRepository: ISubscriptionRepository;
  private observers: { observer: IObserver; city: string; frequency: 'hourly' | 'daily' }[] = [];

  constructor(
    weatherService: IWeatherService,
    emailSender: IEmailSender,
    subscriptionRepository: ISubscriptionRepository
  ) {
    this.weatherService = weatherService;
    this.emailSender = emailSender;
    this.subscriptionRepository = subscriptionRepository;
    this.syncWithDB().catch(err => {
      console.error('Failed to sync observers on initialization:', err);
    });
  }

  async syncWithDB(): Promise<void> {
    try {
      const allSubscriptions = await this.subscriptionRepository.findAll();

      this.observers = allSubscriptions.map(subscription => ({
        observer: new EmailObserver(subscription.email, subscription.unsubscribeToken, this.emailSender),
        city: subscription.city,
        frequency: subscription.frequency,
      }));
    } catch (error) {
      console.error('Error in syncWithDB:', error);
      throw error;
    }
  }

  async registerObserver(observer: IObserver, city: string, frequency: 'hourly' | 'daily') {
    const subscription = await this.subscriptionRepository.findOne({
      email: (observer as EmailObserver).getEmail(),
      city,
      frequency,
      confirmed: true
    });

    if (!subscription) {
      return;
    }

    await this.syncWithDB();

    const exists = this.observers.some(
      obs =>
        obs.observer instanceof EmailObserver &&
            (obs.observer as EmailObserver).getEmail() === (observer as EmailObserver).getEmail() &&
            obs.city === city &&
            obs.frequency === frequency
    );

    if (!exists) {
      this.observers.push({ observer, city, frequency });
    }
  }

  async removeObserver(observer: IObserver, city: string) {
    await this.syncWithDB();

    this.observers = this.observers.filter(obs => {
      if (!(obs.observer instanceof EmailObserver) || !(observer instanceof EmailObserver)) {
        return obs.observer !== observer || obs.city !== city;
      }

      return !(obs.observer.equals(observer) && obs.city === city);
    });
  }

  async notifyObservers(city: string, frequency: 'hourly' | 'daily') {
    const observersToNotify = this.observers.filter(obs => obs.city === city && obs.frequency === frequency);

    for (const obs of observersToNotify) {
      const weather = await this.weatherService.getWeather(city);
      await obs.observer.update(city, weather);
    }
  }
}

export default SubscriptionSubject;