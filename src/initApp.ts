import SequelizeSubscriptionRepository from './repositories/SequelizeSubscriptionRepository';
import { EmailSender } from './utils/EmailSender';
import SubscriptionSubject from './utils/subscriptionSubject';
import { SendGridProvider } from './utils/emailProviders/SendGridProvider';
import { WeatherApiComProvider } from './utils/weatherProviders/WeatherApiComProvider';
import {WeatherService} from './services/weatherService';
import {WeatherController} from './controllers/weatherController';
import SubscriptionService from './services/subscriptionService';
import {SubscriptionController} from './controllers/subscriptionController';

export interface AppDependencies {
    weatherService: WeatherService;
    weatherController: WeatherController;
    subscriptionService: SubscriptionService;
    subscriptionController: SubscriptionController;
    emailSender: EmailSender;
    subscriptionSubject: SubscriptionSubject;
}

export function initDependencies(): AppDependencies {
  const subscriptionRepository = new SequelizeSubscriptionRepository();
  const weatherProvider = new WeatherApiComProvider();
  const weatherService = new WeatherService(weatherProvider);
  const emailProvider = new SendGridProvider();
  const emailSender = new EmailSender(emailProvider);
  const subscriptionSubject = new SubscriptionSubject(weatherService, emailSender, subscriptionRepository);
  const subscriptionService = new SubscriptionService(subscriptionRepository, emailSender, subscriptionSubject);
  const weatherController = new WeatherController(weatherService);
  const subscriptionController = new SubscriptionController(subscriptionService);

  return {
    weatherService,
    weatherController,
    subscriptionService,
    subscriptionController,
    emailSender,
    subscriptionSubject
  };
}