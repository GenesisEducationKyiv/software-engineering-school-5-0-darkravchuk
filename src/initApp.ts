import SequelizeSubscriptionRepository from './repositories/SequelizeSubscriptionRepository';
import { EmailSender } from './utils/EmailSender';
import SubscriptionSubject from './utils/subscriptionSubject';
import { SendGridProvider } from './utils/emailProviders/SendGridProvider';
import { WeatherApiComProvider } from './utils/weatherProviders/WeatherApiComProvider';
import { OpenWeatherMapProvider } from './utils/weatherProviders/OpenWeatherMapProvider';
import { AccuWeatherProvider } from './utils/weatherProviders/AccuWeatherProvider';
import { WeatherProviderChain } from './utils/weatherProviders/WeatherProviderChain';
import { RedisCache } from './utils/cache/RedisCache';
import { PrometheusMetrics } from './utils/metrics/PrometheusMetrics';
import {WeatherService} from './services/weatherService';
import {CachedWeatherService} from './services/CachedWeatherService';
import {WeatherController} from './controllers/weatherController';
import SubscriptionService from './services/subscriptionService';
import {SubscriptionController} from './controllers/subscriptionController';

export interface AppDependencies {
    weatherService: CachedWeatherService;
    weatherController: WeatherController;
    subscriptionService: SubscriptionService;
    subscriptionController: SubscriptionController;
    emailSender: EmailSender;
    subscriptionSubject: SubscriptionSubject;
    cache: RedisCache;
    metrics: PrometheusMetrics;
}

export function initDependencies(): AppDependencies {
  const subscriptionRepository = new SequelizeSubscriptionRepository();
  
  // Initialize Prometheus metrics
  const metrics = new PrometheusMetrics();
  
  // Initialize Redis cache with Prometheus metrics
  const cache = new RedisCache({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    ttl: parseInt(process.env.CACHE_TTL || '300') // 5 minutes default
  }, metrics);
  
  // Create weather provider chain with multiple providers
  const weatherProviderChain = new WeatherProviderChain();
  weatherProviderChain.addProvider(new WeatherApiComProvider());
  weatherProviderChain.addProvider(new OpenWeatherMapProvider());
  weatherProviderChain.addProvider(new AccuWeatherProvider());
  
  // Create base weather service
  const baseWeatherService = new WeatherService(weatherProviderChain);
  
  // Wrap with cached weather service
  const weatherService = new CachedWeatherService(baseWeatherService, cache, metrics);
  
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
    subscriptionSubject,
    cache,
    metrics
  };
}