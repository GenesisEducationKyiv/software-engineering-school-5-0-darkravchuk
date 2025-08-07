import {NotificationTemplate} from '../../domain/value-objects';

const domain = process.env.DOMAIN || 'http://localhost';
const port = process.env.PORT || '3001';

export interface EmailContent {
    to: string;
    from: string;
    subject: string;
    text?: string;
    html?: string;
}

export function buildConfirmationEmail(to: string, notification: NotificationTemplate, context: Record<string, any>): EmailContent {
  return {
    to,
    from: process.env.EMAIL || '',
    subject: notification.subject,
    html: notification.renderBody(context),
  };
}

export function buildWeatherUpdateEmail(to: string, city: string, unsubscribeToken: string, weather: {
    temperature: number;
    description: string;
    humidity: number;
    pressure: number;
}): EmailContent {

  const unsubscribeLink = `${domain}:${port}/api/subscription/unsubscribe/${unsubscribeToken}`;

  return {
    to,
    from: process.env.EMAIL || '',
    subject: `Weather Update for ${city}`,
    text: `Current weather in ${city}:\nTemperature: ${weather.temperature}°C\nDescription: ${weather.description}\nHumidity: ${weather.humidity}%\nPressure: ${weather.pressure} hPa`,
    html: `
      <h2>Weather Update for ${city}</h2>
      <p><strong>Temperature:</strong> ${weather.temperature}°C</p>
      <p><strong>Description:</strong> ${weather.description}</p>
      <p><strong>Humidity:</strong> ${weather.humidity}%</p>
      <p><strong>Pressure:</strong> ${weather.pressure} hPa</p>
      
      <p>Click the link below to unsubscribe:</p>
      <a href="${unsubscribeLink}">${unsubscribeLink}</a>
    `,
  };
}

export function buildUnsubscribeEmail(to: string, unsubscribeToken: string): EmailContent {

  const unsubscribeLink = `${domain}:${port}/api/subscription/unsubscribe/${unsubscribeToken}`;
  return {
    to,
    from: process.env.EMAIL || '',
    subject: 'Unsubscribe from Weather Updates',
    text: `To unsubscribe from weather updates, click the link: ${unsubscribeLink}`,
    html: `
      <h2>Unsubscribe from Weather Updates</h2>
      <p>Click the link below to unsubscribe:</p>
      <a href="${unsubscribeLink}">${unsubscribeLink}</a>
    `,
  };
}