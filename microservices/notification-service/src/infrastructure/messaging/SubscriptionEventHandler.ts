import { MessageHandler } from '../../domain/repositories/IMessageBroker';
import { SendNotificationUseCase } from '../../application/use-cases/SendNotificationUseCase';

export interface SubscriptionCreatedEvent {
  subscriptionId: string;
  email: string;
  city: string;
  createdAt: string;
}

export interface DailyWeatherEvent {
  subscriptionId: string;
  email: string;
  city: string;
  weatherData: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed?: number;
  };
  date: string;
}

export class SubscriptionEventHandler implements MessageHandler<SubscriptionCreatedEvent | DailyWeatherEvent> {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async handle(message: SubscriptionCreatedEvent  | DailyWeatherEvent): Promise<void> {
    try {

      if ('createdAt' in message) {
        await this.handleSubscriptionCreated(message as SubscriptionCreatedEvent);
      } else if ('weatherData' in message) {
        await this.handleDailyWeather(message as DailyWeatherEvent);
      } else {
        console.warn('Unknown message type received:', message);
      }
    } catch (error) {
      console.error('Error handling subscription event:', error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(event: SubscriptionCreatedEvent): Promise<void> {
    console.log(`📧 Sending welcome email for subscription: ${event.subscriptionId}`);

    await this.sendNotificationUseCase.execute({
      recipient: event.email,
      templateType: 'welcome',
      context: {
        name: event.email.split('@')[0],
        city: event.city,
        email: event.email,
        confirmationLink: `${process.env.APP_URL}/confirm/${event.subscriptionId}` || '#',
        subscriptionId: event.subscriptionId
      },
      priority: 'normal'
    });

    console.log(`Welcome email queued for ${event.email}`);
  }

  private async handleDailyWeather(event: DailyWeatherEvent): Promise<void> {
    console.log(`Sending daily weather email for subscription: ${event.subscriptionId}`);

    const forecastSummary = this.generateForecastSummary(event.weatherData);

    await this.sendNotificationUseCase.execute({
      recipient: event.email,
      templateType: 'daily_weather',
      context: {
        name: event.email.split('@')[0],
        city: event.city,
        email: event.email,
        date: new Date(event.date).toLocaleDateString(),
        temperature: event.weatherData.temperature,
        condition: event.weatherData.condition,
        humidity: event.weatherData.humidity,
        windSpeed: event.weatherData.windSpeed || 'N/A',
        forecastSummary,
        unsubscribeLink: `${process.env.APP_URL}/unsubscribe/${event.subscriptionId}` || '#'
      },
      priority: 'low'
    });

    console.log(`Daily weather email queued for ${event.email} in ${event.city}`);
  }

  private generateForecastSummary(weatherData: any): string {
    const { temperature, condition, humidity } = weatherData;
    
    if (temperature > 25) {
      return "It's going to be a warm day! Perfect for outdoor activities.";
    } else if (temperature < 5) {
      return "Bundle up! It's going to be quite cold today.";
    } else if (humidity > 80) {
      return "High humidity expected. You might feel muggy today.";
    } else if (condition.toLowerCase().includes('rain')) {
      return "Don't forget your umbrella! Rain is expected today.";
    } else {
      return "Have a wonderful day!";
    }
  }
}
