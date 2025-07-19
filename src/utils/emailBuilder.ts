export interface EmailContent {
    to: string;
    from: string;
    subject: string;
    text: string;
    html: string;
}

export function buildConfirmationEmail(to: string, confirmationToken: string): EmailContent {
  const domain = process.env.DOMAIN || 'http://localhost';
  const confirmationLink = `${domain}/api/subscription/confirm/${confirmationToken}`;
  return {
    to,
    from: process.env.EMAIL || '',
    subject: 'Confirm Your Weather Subscription',
    text: `Please confirm your subscription by clicking the link: ${confirmationLink}`,
    html: `
      <h2>Confirm Your Weather Subscription</h2>
      <p>Click the link below to confirm your subscription:</p>
      <a href="${confirmationLink}">${confirmationLink}</a>
    `,
  };
}

export function buildWeatherUpdateEmail(to: string, city: string, unsubscribeToken: string, weather: {
    temperature: number;
    description: string;
    humidity: number;
    pressure: number;
}): EmailContent {
  const domain = process.env.DOMAIN || 'http://localhost';
  const unsubscribeLink = `${domain}/api/subscription/unsubscribe/${unsubscribeToken}`;

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
  const domain = process.env.DOMAIN || 'http://localhost';
  const unsubscribeLink = `${domain}/api/subscription/unsubscribe/${unsubscribeToken}`;
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