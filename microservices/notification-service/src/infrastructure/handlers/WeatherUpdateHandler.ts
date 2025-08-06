import { MessageHandler } from '../../domain/repositories/IMessageBroker';
import { SendNotificationUseCase } from '../../application/use-cases';

export interface WeatherUpdateEvent {
  scheduleId: string;
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  timestamp: string;
}

export class WeatherUpdateHandler implements MessageHandler<WeatherUpdateEvent> {
  constructor(
    private readonly sendNotificationUseCase: SendNotificationUseCase
  ) {}

  async handle(event: WeatherUpdateEvent): Promise<void> {
    console.log('🌤️ Processing weather.update event:', event);

    try {
      const mockSubscriberEmail = 'user@example.com';

      await this.sendNotificationUseCase.execute({
        recipient: mockSubscriberEmail,
        templateType: 'daily_weather',
        context: {
          name: mockSubscriberEmail.split('@')[0],
          city: event.location,
          temperature: event.temperature,
          condition: event.condition,
          humidity: event.humidity,
          windSpeed: event.windSpeed,
          timestamp: new Date(event.timestamp).toLocaleString(),
          unsubscribeLink: `http://localhost:3001/api/subscriptions/unsubscribe/example-id`
        },
        priority: 'normal'
      });

      console.log(`✅ Weather update notification sent for ${event.location}`);
    } catch (error) {
      console.error('❌ Failed to send weather update notification:', error);
      throw error;
    }
  }
}
