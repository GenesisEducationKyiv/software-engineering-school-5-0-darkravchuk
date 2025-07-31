import { IEmailProvider } from '../interfaces/IEmailProvider';
import { IEmailSender } from '../interfaces/IEmailSender';
import { buildConfirmationEmail, buildWeatherUpdateEmail, buildUnsubscribeEmail, EmailContent } from './emailBuilder';

export class EmailSender implements IEmailSender {
  constructor(
      private emailProvider: IEmailProvider,
  ) {
    this.emailProvider.configure({
      apiKey: process.env.SENDGRID_API_KEY || '',
    });
  }

  async sendConfirmationEmail(to: string, confirmationToken: string): Promise<void> {
    const emailContent = buildConfirmationEmail(to, confirmationToken);
    this.emailProvider.send(emailContent);
  }

  async sendWeatherUpdateEmail(to: string, city: string, unsubscribeToken: string, weather: {
    temperature: number;
    description: string;
    humidity: number;
    pressure: number;
  }): Promise<void> {
    const emailContent = buildWeatherUpdateEmail(to, city, unsubscribeToken, weather);
    this.emailProvider.send(emailContent);
  }

  async sendUnsubscribeEmail(to: string, unsubscribeToken: string): Promise<void> {
    const emailContent = buildUnsubscribeEmail(to, unsubscribeToken);
    this.emailProvider.send(emailContent);
  }
}