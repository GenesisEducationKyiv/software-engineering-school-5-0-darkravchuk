import {EmailAddress, NotificationTemplate} from '../../domain/value-objects';

export interface IEmailSender {
    sendConfirmationEmail(to: EmailAddress, notification: NotificationTemplate, context: Record<string, any>): Promise<void>;
    sendWeatherUpdateEmail(to: string, city: string, unsubscribeToken: string, weather: {
        temperature: number;
        description: string;
        humidity: number;
        pressure: number;
    }): Promise<void>;
    sendUnsubscribeEmail(to: string, unsubscribeToken: string): Promise<void>;
}