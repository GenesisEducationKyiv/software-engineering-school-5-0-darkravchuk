import { WeatherData } from '../entities/WeatherData';
import { WeatherForecast } from '../entities/WeatherForecast';
import { City } from '../value-objects/City';
import { Coordinates } from '../value-objects/Coordinates';

export interface IWeatherRepository {
  findCurrentWeatherByCity(city: City): Promise<WeatherData | null>;
  findCurrentWeatherByCoordinates(coordinates: Coordinates): Promise<WeatherData | null>;
  saveCurrentWeather(weatherData: WeatherData): Promise<void>;
  
  findForecastByCity(city: City, days?: number): Promise<WeatherForecast | null>;
  findForecastByCoordinates(coordinates: Coordinates, days?: number): Promise<WeatherForecast | null>;
  saveForecast(forecast: WeatherForecast): Promise<void>;
  
  clearStaleWeatherData(maxAgeMinutes?: number): Promise<number>;
  clearStaleForecast(maxAgeHours?: number): Promise<number>;
  
  findMultipleCitiesWeather(cities: City[]): Promise<WeatherData[]>;
  saveMultipleWeatherData(weatherData: WeatherData[]): Promise<void>;
}
