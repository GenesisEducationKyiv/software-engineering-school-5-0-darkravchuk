
import { buildConfirmationEmail, buildWeatherUpdateEmail, buildUnsubscribeEmail } from './emailBuilder';
import {IEmailSender} from './IEmailSender';
import {IEmailProvider} from './IEmailProvider';
import {EmailAddress, NotificationTemplate} from '../../domain/value-objects';

export class EmailSender implements IEmailSender {
  constructor(
        private emailProvider: IEmailProvider,
  ) {
    this.emailProvider.configure({
      apiKey: process.env.SENDGRID_API_KEY || '',
    });
  }

  async sendConfirmationEmail(to: EmailAddress, template: NotificationTemplate, context: Record<string, any>): Promise<void> {
    const emailContent = buildConfirmationEmail(to.toString(), template, context);
    await this.emailProvider.send(emailContent);
  }

  async sendWeatherUpdateEmail(to: string, city: string, unsubscribeToken: string, weather: {
        temperature: number;
        description: string;
        humidity: number;
        pressure: number;
    }): Promise<void> {
    const emailContent = buildWeatherUpdateEmail(to, city, unsubscribeToken, weather);
    await this.emailProvider.send(emailContent);
  }

  async sendUnsubscribeEmail(to: string, unsubscribeToken: string): Promise<void> {
    const emailContent = buildUnsubscribeEmail(to, unsubscribeToken);
    await this.emailProvider.send(emailContent);
  }
}