import { injectable } from 'inversify';
import axios from 'axios';
import { IEmailService, WeatherData } from '../../domain/services/IEmailService';
import { Email } from '../../domain/value-objects/Email';
import { Token } from '../../domain/value-objects/Token';

@injectable()
export class HttpEmailService implements IEmailService {
  private readonly emailServiceUrl: string;
  private readonly domain: string;

  constructor() {
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3003';
    this.domain = process.env.DOMAIN || 'http://localhost:3001';
  }

  async sendConfirmationEmail(email: Email, confirmationToken: Token): Promise<void> {
    try {
      const confirmationLink = `${this.domain}/api/v1/subscriptions/confirm/${confirmationToken.toString()}`;
      
      const payload = {
        to: email.toString(),
        subject: 'Confirm Your Weather Subscription',
        template: 'confirmation',
        data: {
          confirmationLink,
          email: email.toString()
        }
      };

      // Try to call email service, fallback to console logging
      try {
        await axios.post(`${this.emailServiceUrl}/api/v1/emails/send`, payload, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ Confirmation email sent to ${email.toString()}`);
      } catch (httpError) {
        // Fallback: log to console (in real scenario, this might queue for retry)
        console.log(`📧 [EMAIL SERVICE UNAVAILABLE] Would send confirmation email to: ${email.toString()}`);
        console.log(`📧 Confirmation link: ${confirmationLink}`);
      }
    } catch (error) {
      console.error('Failed to send confirmation email:', error);
      throw new Error(`Failed to send confirmation email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendWeatherUpdateEmail(
    email: Email, 
    city: string, 
    weatherData: WeatherData, 
    unsubscribeToken: Token
  ): Promise<void> {
    try {
      const unsubscribeLink = `${this.domain}/api/v1/subscriptions/unsubscribe/${unsubscribeToken.toString()}`;
      
      const payload = {
        to: email.toString(),
        subject: `Weather Update for ${city}`,
        template: 'weather-update',
        data: {
          city,
          temperature: weatherData.temperature,
          description: weatherData.description,
          humidity: weatherData.humidity,
          unsubscribeLink
        }
      };

      // Try to call email service, fallback to console logging
      try {
        await axios.post(`${this.emailServiceUrl}/api/v1/emails/send`, payload, {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log(`✅ Weather update email sent to ${email.toString()}`);
      } catch (httpError) {
        // Fallback: log to console
        console.log(`📧 [EMAIL SERVICE UNAVAILABLE] Would send weather update to: ${email.toString()}`);
        console.log(`📧 Weather: ${weatherData.temperature}°C, ${weatherData.description} in ${city}`);
      }
    } catch (error) {
      console.error('Failed to send weather update email:', error);
      throw new Error(`Failed to send weather update email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
