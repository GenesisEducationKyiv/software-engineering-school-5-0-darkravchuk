import { IWeatherService } from './WeatherService.interface';
import { IWeatherProvider } from '../interfaces/IWeatherProvider';
import {IWeatherData} from '../interfaces/weather/IWeatherData';

export class WeatherService implements IWeatherService {
  constructor(private weatherProvider: IWeatherProvider) {
    this.weatherProvider.configure({
      apiKey: process.env.WEATHER_API_KEY || '',
    });
  }

  async getWeather(city: string): Promise<IWeatherData> {
    return await this.weatherProvider.getWeather(city);
  }
}