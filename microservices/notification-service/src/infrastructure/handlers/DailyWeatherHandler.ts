import { MessageHandler } from '../../domain/repositories/IMessageBroker';
import { SendNotificationUseCase } from '../../application/use-cases';

export interface DailyWeatherEvent {
  subscriptionId: string;
  email: string;
  city: string;
  date: string;
  weather: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast?: {
    summary: string;
    nextDays: Array<{
      date: string;
      temperature: { min: number; max: number };
      condition: string;
    }>;
  };
}

export class DailyWeatherHandler implements MessageHandler<DailyWeatherEvent> {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async handle(event: DailyWeatherEvent): Promise<void> {
    console.log('📬 Processing weather.daily event:', event);

    try {
      const forecastSummary = event.forecast?.summary || 'No forecast available';

      await this.sendNotificationUseCase.execute({
        recipient: event.email,
        templateType: 'daily_weather',
        context: {
          name: event.email.split('@')[0],
          email: event.email,
          city: event.city,
          date: new Date(event.date).toLocaleDateString(),
          temperature: event.weather.temperature,
          condition: event.weather.condition,
          humidity: event.weather.humidity,
          windSpeed: event.weather.windSpeed,
          forecastSummary,
          unsubscribeLink: `http://localhost:3001/api/subscriptions/unsubscribe/${event.subscriptionId}`
        },
        priority: 'low'
      });

      console.log('Daily weather notification sent for subscription:', event.subscriptionId);
    } catch (error) {
      console.error('Failed to send daily weather notification:', error);
      throw error;
    }
  }
}
