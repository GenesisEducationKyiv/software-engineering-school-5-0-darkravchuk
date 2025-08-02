import { IWeatherService } from './WeatherService.interface';
import { IWeatherProvider } from '../interfaces/IWeatherProvider';
import {IWeatherData} from '../interfaces/weather/IWeatherData';

export class WeatherService implements IWeatherService {
  constructor(private weatherProvider: IWeatherProvider) {
    this.weatherProvider.configure({
      WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
      ACCUWEATHER_API_KEY: process.env.ACCUWEATHER_API_KEY || '',
    });
  }

  async getWeather(city: string): Promise<IWeatherData> {
    if (!this.weatherProvider.isAvailable()) {
      throw new Error('No weather providers are available');
    }

    return await this.weatherProvider.getWeather(city);
  }
}