import { Observer } from '../types/Observer';
import { IEmailSender } from '../types/IEmailSender';

export default class EmailObserver implements Observer {
  constructor(
      private email: string,
      private unsubscribeToken: string,
      private emailSender: IEmailSender,
  ) {}

  async update(city: string, weather: {
    temperature: number;
    description: string;
    humidity: number;
    pressure: number;
  }): Promise<void> {
    try {
      await this.emailSender.sendWeatherUpdateEmail(this.email, city, this.unsubscribeToken, weather);
      console.log(`Weather update email sent to ${this.email}`);
    } catch (error) {
      console.error('Error sending weather update email:', error);
      throw new Error('Failed to send weather update email');
    }
  }

  getEmail(): string {
    return this.email;
  }

  equals(other: Observer): boolean {
    if (!(other instanceof EmailObserver)) return false;
    return this.email === other.email && this.unsubscribeToken === other.unsubscribeToken;
  }
}