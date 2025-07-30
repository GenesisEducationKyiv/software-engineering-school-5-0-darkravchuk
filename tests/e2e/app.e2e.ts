import express from 'express';
import { IWeatherProvider } from '../../src/interfaces/IWeatherProvider';
import { IEmailProvider } from '../../src/interfaces/IEmailProvider';
import { ISubscriptionRepository } from '../../src/interfaces/ISubscriptionRepository';
import { ISubscription } from '../../src/interfaces/ISubscription';
import { EmailSender } from '../../src/utils/EmailSender';
import { WeatherService } from '../../src/services/weatherService';
import { SubscriptionController } from '../../src/controllers/subscriptionController';
import subscriptionRouter from '../../src/routes/subscriptionRouter';
import SubscriptionService from '../../src/services/subscriptionService';

const mockWeatherProvider: IWeatherProvider = {
  configure: () => {},
  getWeather: async (city: string) => ({
    city,
    temperature: 20,
    description: 'Sunny',
    humidity: 60,
    pressure: 1013,
    windSpeed: 5,
  }),
};

const mockEmailProvider: IEmailProvider = {
  configure: () => {},
  send: async () => {},
};

class TestSubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: ISubscription[] = [];
  private idCounter = 1;

  async findByEmail(email: string): Promise<ISubscription | null> {
    return this.subscriptions.find(s => s.email === email) || null;
  }

  async findByConfirmationToken(token: string): Promise<ISubscription | null> {
    return this.subscriptions.find(s => s.confirmationToken === token) || null;
  }

  async findByUnsubscribeToken(token: string): Promise<ISubscription | null> {
    return this.subscriptions.find(s => s.unsubscribeToken === token) || null;
  }

  async findAllByFrequency(frequency: 'hourly' | 'daily'): Promise<ISubscription[]> {
    return this.subscriptions.filter(s => s.frequency === frequency);
  }

  async findOne(filter: { email: string; city: string; frequency: 'hourly' | 'daily'; confirmed: boolean }): Promise<ISubscription | null> {
    return this.subscriptions.find(s =>
      s.email === filter.email &&
            s.city === filter.city &&
            s.frequency === filter.frequency &&
            s.confirmed === filter.confirmed
    ) || null;
  }

  async create(data: ISubscription): Promise<ISubscription> {
    const subscription = { ...data, id: this.idCounter++ };
    this.subscriptions.push(subscription);
    return subscription;
  }

  async update(subscription: ISubscription): Promise<ISubscription> {
    const index = this.subscriptions.findIndex(s => s.id === subscription.id);
    if (index === -1) throw new Error('Subscription not found');
    this.subscriptions[index] = subscription;
    return subscription;
  }

  async delete(subscription: ISubscription): Promise<void> {
    const index = this.subscriptions.findIndex(s => s.id === subscription.id);
    if (index !== -1) this.subscriptions.splice(index, 1);
  }

  async findAll(): Promise<ISubscription[]> {
    return this.subscriptions;
  }

  async reset() {
    this.subscriptions = [];
    this.idCounter = 1;
  }
}

const app = express();
app.use(express.json());
app.use(express.static('public')); // Serve index.html from public folder

const subscriptionRepository = new TestSubscriptionRepository();
const emailSender = new EmailSender(mockEmailProvider);
const weatherService = new WeatherService(mockWeatherProvider);
const subscriptionService = new SubscriptionService(subscriptionRepository, emailSender, {
  registerObserver: async () => {},
  removeObserver: async () => {},
  notifyObservers: async () => {},
});
const subscriptionController = new SubscriptionController(subscriptionService);

app.use('/api/subscription', subscriptionRouter(subscriptionController));

export { app, subscriptionRepository };