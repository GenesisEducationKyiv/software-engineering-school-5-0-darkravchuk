import { WeatherData } from '../entities/WeatherData';
import { WeatherForecast } from '../entities/WeatherForecast';
import { City } from '../value-objects/City';
import { Coordinates } from '../value-objects/Coordinates';

export interface IWeatherApiService {
  getCurrentWeatherByCity(city: City): Promise<WeatherData>;
  getCurrentWeatherByCoordinates(coordinates: Coordinates): Promise<WeatherData>;
  
  getForecastByCity(city: City, days?: number): Promise<WeatherForecast>;
  getForecastByCoordinates(coordinates: Coordinates, days?: number): Promise<WeatherForecast>;
  
  getCurrentWeatherForMultipleCities(cities: City[]): Promise<WeatherData[]>;
  
  isServiceAvailable(): Promise<boolean>;

  searchCitiesByName(partialName: string, limit?: number): Promise<City[]>;
  resolveCityFromCoordinates(coordinates: Coordinates): Promise<City>;
}
