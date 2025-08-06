import { City } from '../value-objects/City';
import { WeatherData } from './IEmailService';

export interface IWeatherService {
  /**
   * Get current weather data for a city
   */
  getWeatherData(city: City): Promise<WeatherData>;

  /**
   * Validate if city exists and has weather data available
   */
  validateCity(city: City): Promise<boolean>;
}
