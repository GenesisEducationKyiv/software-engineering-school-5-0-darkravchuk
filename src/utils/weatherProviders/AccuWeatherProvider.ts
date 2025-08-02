import axios from 'axios';
import { IWeatherProvider } from '../../interfaces/IWeatherProvider';
import { NotFoundError } from '../../errors/httpError';
import { IWeatherData } from '../../interfaces/weather/IWeatherData';
import { WeatherProviderErrorHandler } from './WeatherProviderErrorHandler';

export class AccuWeatherProvider implements IWeatherProvider {
  public readonly name = 'accuweather.com';
  private apiKey: string = '';
  private isConfigured: boolean = false;

  configure(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
    this.isConfigured = !!this.apiKey;
    if (!this.apiKey) {
      //throw new Error('ACCUWEATHER_API_KEY is not set for AccuWeatherProvider');
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  async getWeather(city: string): Promise<IWeatherData> {
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

      return {
        temperature: weather.Temperature.Metric.Value,
        description: weather.WeatherText,
        humidity: weather.RelativeHumidity,
        pressure: weather.Pressure.Metric.Value
      };
    } catch (error) {
      WeatherProviderErrorHandler.handleError(error, {
        providerName: this.name,
        city
      });
    }
  }
} 