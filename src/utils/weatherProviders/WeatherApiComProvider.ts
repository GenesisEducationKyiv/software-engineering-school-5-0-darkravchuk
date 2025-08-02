import axios from 'axios';
import {IWeatherProvider} from '../../interfaces/IWeatherProvider';
import {HttpError, NotFoundError} from '../../errors/httpError';
import {IWeatherData} from '../../interfaces/weather/IWeatherData';

export class WeatherApiComProvider implements IWeatherProvider {
  public readonly name = 'weatherapi.com';
  private apiKey: string = '';
  private isConfigured: boolean = false;

  configure(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.isConfigured = !!this.apiKey;
    if (!this.apiKey) {
      throw new Error('WEATHER_API_KEY is not set for WeatherApiComProvider');
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async getWeather(city: string): Promise<IWeatherData> {
    try {
      const url = `http://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${city}`;
      const response = await axios.get(url, {timeout: 10000});

      if (!response.data || !response.data.current) {
        throw new NotFoundError(`No weather data available for ${city}`);
      }

      const {current} = response.data;

      return {
        temperature: current.temp_c,
        humidity: current.humidity,
        pressure: current.pressure_mb,
        description: current.condition.text
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new NotFoundError(`Weather data for ${city} not found`);
        } else {
          throw new HttpError(500, `Failed to fetch weather for ${city}`);
        }
      }
      throw new HttpError(500, `Unexpected error fetching weather for ${city}`);
    }
  }
}