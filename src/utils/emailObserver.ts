import { MailService } from '@sendgrid/mail';
import { Observer, WeatherData } from '../types';

const sgMail = new MailService();
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

class EmailObserver implements Observer {
    private email: string;
    private unsubscribeToken: string;

    constructor(email: string, unsubscribeToken: string) {
        this.email = email;
        this.unsubscribeToken = unsubscribeToken;
    }

    getEmail(): string {
        return this.email;
    }

    equals(other: EmailObserver): boolean {
        return this.email === other.email;
    }

    async update(city: string, weather: WeatherData): Promise<void> {
        const domain = process.env.DOMAIN || '';
        const unsubscribeLink = `${domain}/unsubscribe/${this.unsubscribeToken}`;
        const msg = {
            from: {
                email: process.env.EMAIL || '',
                name: 'Weather Updates'
            },
            to: this.email,
            subject: `Weather Update for ${city}`,
            text: `Weather in ${city}: ${weather.temperature}°C, ${weather.description}, Humidity: ${weather.humidity}%\n\nTo unsubscribe, click here: ${unsubscribeLink}`,
            html: `
                <h2>Weather Update for ${city}</h2>
                <p>Temperature: ${weather.temperature}°C</p>
                <p>Description: ${weather.description}</p>
                <p>Humidity: ${weather.humidity}%</p>
                <p><a href="${unsubscribeLink}">Unsubscribe</a></p>
            `,
        };

        try {
            const response = await sgMail.send(msg);
            console.log(`Weather update email sent to ${this.email} with status:`, response[0].statusCode);
        } catch (error) {
            throw new Error('Failed to send weather update email');
        }
    }
}

export default EmailObserver;