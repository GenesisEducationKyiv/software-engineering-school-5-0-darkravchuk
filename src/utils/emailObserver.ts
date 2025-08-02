import { IObserver } from '../interfaces/IObserver';
import { IEmailSender } from '../interfaces/IEmailSender';
import {IWeatherData} from '../interfaces/weather/IWeatherData';

export default class EmailObserver implements IObserver {
  constructor(
      private email: string,
      private unsubscribeToken: string,
      private emailSender: IEmailSender,
  ) {}

  async update(city: string, weather: IWeatherData): Promise<void> {
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

  equals(other: IObserver): boolean {
    if (!(other instanceof EmailObserver)) return false;
    return this.email === other.email && this.unsubscribeToken === other.unsubscribeToken;
  }
}