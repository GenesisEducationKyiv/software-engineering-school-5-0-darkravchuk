export interface IEmailSender {
    sendConfirmationEmail(to: string, confirmationToken: string): Promise<void>;
    sendWeatherUpdateEmail(to: string, city: string, unsubscribeToken: string, weather: {
        temperature: number;
        description: string;
        humidity: number;
        pressure: number;
    }): Promise<void>;
    sendUnsubscribeEmail(to: string, unsubscribeToken: string): Promise<void>;
}