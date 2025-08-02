import axios from 'axios';
import { IWeatherProvider } from '../../interfaces/IWeatherProvider';
import { HttpError, NotFoundError } from '../../errors/httpError';
import {IWeatherData} from "../../interfaces/weather/IWeatherData";

export class OpenWeatherMapProvider implements IWeatherProvider {
  public readonly name = 'openweathermap.org';
  private apiKey: string = '';
  private isConfigured: boolean = false;

  configure(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.isConfigured = !!this.apiKey;
    if (!this.apiKey) {
      throw new Error('OPENWEATHER_API_KEY is not set for OpenWeatherMapProvider');
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

      return (
        main.temp,
        weather[0]?.description || 'Unknown',
        main.humidity,
        main.pressure
      );
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Weather data for ${city} not found`);
        } else if (error.response?.status === 401) {
          throw new HttpError(401, `Invalid API key for ${this.name}`);
        } else {
          throw new HttpError(500, `Failed to fetch weather for ${city}`);
        }
      }
      throw new HttpError(500, `Unexpected error fetching weather for ${city}`);
    }
  }
} 