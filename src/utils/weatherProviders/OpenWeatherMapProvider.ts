import axios from 'axios';
import { IWeatherProvider } from '../../interfaces/IWeatherProvider';
import { NotFoundError } from '../../errors/httpError';
import { IWeatherData } from '../../interfaces/weather/IWeatherData';
import { WeatherProviderErrorHandler } from './WeatherProviderErrorHandler';

export class OpenWeatherMapProvider implements IWeatherProvider {
  public readonly name = 'openweathermap.org';
  private apiKey: string = '';
  private isConfigured: boolean = false;

  configure(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.isConfigured = !!this.apiKey;
    if (!this.apiKey) {
      //throw new Error('OPENWEATHER_API_KEY is not set for OpenWeatherMapProvider');
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async getWeather(city: string): Promise<IWeatherData> {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=metric`;
      const response = await axios.get(url, { timeout: 10000 });

      if (!response.data || !response.data.main) {
        throw new NotFoundError(`No weather data available for ${city}`);
      }

      const { main, weather } = response.data;

      return {
        temperature: main.temp,
        description: weather[0]?.description || 'Unknown',
        humidity: main.humidity,
        pressure: main.pressure
      };
    } catch (error) {
      WeatherProviderErrorHandler.handleError(error, {
        providerName: this.name,
        city
      });
    }
  }
} 