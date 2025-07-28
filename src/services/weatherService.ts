import { IWeatherService } from './WeatherService.interface';
import { WeatherDataDTO } from './WeatherDataDTO';
import { IWeatherProvider } from '../types/IWeatherProvider';

export class WeatherService implements IWeatherService {
  constructor(private weatherProvider: IWeatherProvider) {
    this.weatherProvider.configure({
      WEATHER_API_KEY: process.env.WEATHER_API_KEY || '',
      OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY || '',
      ACCUWEATHER_API_KEY: process.env.ACCUWEATHER_API_KEY || '',
    });
  }

  async getWeather(city: string): Promise<WeatherDataDTO> {
    if (!this.weatherProvider.isAvailable()) {
      throw new Error('No weather providers are available');
    }
    
    return await this.weatherProvider.getWeather(city);
  }
}