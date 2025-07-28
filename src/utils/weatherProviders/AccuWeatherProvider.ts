import axios from 'axios';
import { IWeatherProvider } from '../../types/IWeatherProvider';
import { WeatherDataDTO } from '../../services/WeatherDataDTO';
import { HttpError, NotFoundError } from '../../errors/httpError';

export class AccuWeatherProvider implements IWeatherProvider {
  public readonly name = 'accuweather.com';
  private apiKey: string = '';
  private isConfigured: boolean = false;

  configure(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.isConfigured = !!this.apiKey;
    if (!this.apiKey) {
      throw new Error('ACCUWEATHER_API_KEY is not set for AccuWeatherProvider');
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async getWeather(city: string): Promise<WeatherDataDTO> {
    try {
      const locationUrl = `http://dataservice.accuweather.com/locations/v1/cities/search?apikey=${this.apiKey}&q=${city}`;
      const locationResponse = await axios.get(locationUrl, { timeout: 10000 });

      if (!locationResponse.data || locationResponse.data.length === 0) {
        throw new NotFoundError(`City ${city} not found`);
      }

      const locationKey = locationResponse.data[0].Key;

      const weatherUrl = `http://dataservice.accuweather.com/currentconditions/v1/${locationKey}?apikey=${this.apiKey}`;
      const weatherResponse = await axios.get(weatherUrl, { timeout: 10000 });

      if (!weatherResponse.data || weatherResponse.data.length === 0) {
        throw new NotFoundError(`No weather data available for ${city}`);
      }

      const weather = weatherResponse.data[0];

      return new WeatherDataDTO(
        weather.Temperature.Metric.Value,
        weather.WeatherText,
        weather.RelativeHumidity,
        weather.Pressure.Metric.Value
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