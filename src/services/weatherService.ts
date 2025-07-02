import axios from 'axios';
import * as dotenv from 'dotenv';
import { HttpError, NotFoundError } from '../errors/httpError';
import { IWeatherService } from './WeatherService.interface';
import { WeatherDataDTO } from './WeatherDataDTO';

dotenv.config();

class WeatherService implements IWeatherService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('WEATHER_API_KEY is not set in environment variables');
    }
  }

  async getWeather(city: string): Promise<WeatherDataDTO> {
    try {
      const url = `http://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${city}`;
      const response = await axios.get(url, { timeout: 10000 });

      if (!response.data || !response.data.current) {
        throw new NotFoundError(`No weather data available for ${city}`);
      }

      const { current } = response.data;

      return new WeatherDataDTO(
        current.temp_c,
        current.condition.text,
        current.humidity,
        current.pressure_mb
      );
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

export default new WeatherService();