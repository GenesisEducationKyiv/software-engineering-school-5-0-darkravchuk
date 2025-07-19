import axios from 'axios';
import { IWeatherProvider } from '../../types/IWeatherProvider';
import { WeatherDataDTO } from '../../services/WeatherDataDTO';
import { HttpError, NotFoundError } from '../../errors/httpError';

export class WeatherApiComProvider implements IWeatherProvider {
  private apiKey: string = '';

  configure(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    if (!this.apiKey) {
      throw new Error('WEATHER_API_KEY is not set for WeatherApiComProvider');
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