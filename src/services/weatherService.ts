import { IWeatherService } from './WeatherService.interface';
import { WeatherDataDTO } from './WeatherDataDTO';
import { IWeatherProvider } from '../types/IWeatherProvider';

export class WeatherService implements IWeatherService {
  constructor(private weatherProvider: IWeatherProvider) {
    this.weatherProvider.configure({
      apiKey: process.env.WEATHER_API_KEY || '',
    });
  }

  async getWeather(city: string): Promise<WeatherDataDTO> {
    return await this.weatherProvider.getWeather(city);
  }
}