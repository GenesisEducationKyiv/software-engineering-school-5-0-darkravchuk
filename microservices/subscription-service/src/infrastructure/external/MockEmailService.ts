import { injectable } from 'inversify';
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
      // In a real implementation, this would make HTTP call to notification service
      // For now, we'll simulate it
      console.log(`📧 [MOCK] Sending confirmation email to ${email.toString()}`);
      console.log(`📧 [MOCK] Confirmation URL: http://localhost:3000/confirm/${confirmationToken.toString()}`);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
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
      // In a real implementation, this would make HTTP call to notification service
      // For now, we'll simulate it
      console.log(`📧 [MOCK] Sending weather update to ${email.toString()}`);
      console.log(`📧 [MOCK] Weather for ${city}: ${weatherData.temperature}°C, ${weatherData.description}`);
      console.log(`📧 [MOCK] Unsubscribe URL: http://localhost:3000/unsubscribe/${unsubscribeToken.toString()}`);
      
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to send weather update email:', error);
      throw new Error(`Failed to send weather update email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
