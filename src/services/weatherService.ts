import { IWeatherService } from './WeatherService.interface';
import { IWeatherProvider } from '../interfaces/IWeatherProvider';
import {IWeatherData} from '../interfaces/weather/IWeatherData';

export class WeatherService implements IWeatherService {
  constructor(private weatherProvider: IWeatherProvider) {
    // Weather service should not configure providers
    // Configuration should be handled by the dependency injection layer
  }

  async getWeather(city: string): Promise<IWeatherData> {
    if (!this.weatherProvider.isAvailable()) {
      throw new Error('No weather providers are available');
    }

    return await this.weatherProvider.getWeather(city);
  }
}