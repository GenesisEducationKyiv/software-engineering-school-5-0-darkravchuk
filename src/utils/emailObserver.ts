import sgMail from '@sendgrid/mail';
import { Observer, WeatherData } from '../types';

class EmailObserver implements Observer {
    private email: string;

    constructor(email: string) {
        this.email = email;
    }

    async update(city: string, weather: WeatherData): Promise<void> {
        const msg = {
            to: this.email,
            from: 'darija.kravchuk@knu.ua', // Replace with your verified sender email
            subject: `Weather Update for ${city}`,
            text: `Weather in ${city}: ${weather.temperature}°C, ${weather.description}, Humidity: ${weather.humidity}%`,
            html: `
                <h2>Weather Update for ${city}</h2>
                <p>Temperature: ${weather.temperature}°C</p>
                <p>Description: ${weather.description}</p>
                <p>Humidity: ${weather.humidity}%</p>
            `,
        };

        try {
            await sgMail.send(msg);
            console.log(`Weather update email sent to ${this.email}`);
        } catch (error) {
            console.error('Error sending weather update email:', error);
            throw new Error('Failed to send weather update email');
        }
    }
}

export default EmailObserver;