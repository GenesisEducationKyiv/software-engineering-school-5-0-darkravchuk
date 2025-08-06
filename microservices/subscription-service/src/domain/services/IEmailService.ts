import { Email } from '../value-objects/Email';
import { Token } from '../value-objects/Token';

export interface IEmailService {
  /**
   * Send confirmation email to subscriber
   */
  sendConfirmationEmail(email: Email, confirmationToken: Token): Promise<void>;

  /**
   * Send weather update email
   */
  sendWeatherUpdateEmail(
    email: Email, 
    city: string, 
    weatherData: WeatherData, 
    unsubscribeToken: Token
  ): Promise<void>;
}

export interface WeatherData {
  temperature: number;
  description: string;
  humidity: number;
  pressure?: number;
}
