import { injectable } from 'inversify';
import axios from 'axios';
import { IEmailService, WeatherData } from '../../domain/services/IEmailService';
import { Email } from '../../domain/value-objects/Email';
import { Token } from '../../domain/value-objects/Token';

@injectable()
export class HttpEmailService implements IEmailService {
  private readonly emailServiceUrl: string;

  constructor() {
    this.emailServiceUrl = process.env.EMAIL_SERVICE_URL || 'http://localhost:3003';
  }

  async sendConfirmationEmail(email: Email, confirmationToken: Token): Promise<void> {
    try {
      const confirmationLink = `${process.env.DOMAIN || 'http://localhost:3001'}/api/v1/subscriptions/confirm/${confirmationToken.toString()}`;
      
      await axios.post(
        `${this.emailServiceUrl}/api/v1/emails/confirmation`,
        {
          to: email.toString(),
          confirmationLink,
          confirmationToken: confirmationToken.toString()
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`📧 Confirmation email sent to ${email.toString()}`);
    } catch (error) {
      if (axios.isAxiosError(error) && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
        // Email service is unavailable, log instead of sending
        console.log(`📧 [EMAIL SERVICE UNAVAILABLE] Would send confirmation email to ${email.toString()}`);
        console.log(`📧 Confirmation link: ${process.env.DOMAIN || 'http://localhost:3001'}/api/v1/subscriptions/confirm/${confirmationToken.toString()}`);
        return;
      }

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
      const unsubscribeLink = `${process.env.DOMAIN || 'http://localhost:3001'}/api/v1/subscriptions/unsubscribe/${unsubscribeToken.toString()}`;
      
      await axios.post(
        `${this.emailServiceUrl}/api/v1/emails/weather-update`,
        {
          to: email.toString(),
          city,
          weatherData,
          unsubscribeLink,
          unsubscribeToken: unsubscribeToken.toString()
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`📧 Weather update email sent to ${email.toString()}`);
    } catch (error) {
      if (axios.isAxiosError(error) && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
        // Email service is unavailable, log instead of sending
        const unsubscribeLink = `${process.env.DOMAIN || 'http://localhost:3001'}/api/v1/subscriptions/unsubscribe/${unsubscribeToken.toString()}`;
        console.log(`📧 [EMAIL SERVICE UNAVAILABLE] Would send weather update to ${email.toString()}`);
        console.log(`📧 Weather: ${weatherData.temperature}°C, ${weatherData.description} in ${city}`);
        console.log(`📧 Unsubscribe link: ${unsubscribeLink}`);
        return;
      }

      console.error('Failed to send weather update email:', error);
      throw new Error(`Failed to send weather update email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
