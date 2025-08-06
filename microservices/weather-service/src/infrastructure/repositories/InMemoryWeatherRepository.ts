import { IWeatherRepository } from '../../domain/repositories/IWeatherRepository';
import { WeatherData } from '../../domain/entities/WeatherData';
import { WeatherForecast } from '../../domain/entities/WeatherForecast';
import { City } from '../../domain/value-objects/City';
import { Coordinates } from '../../domain/value-objects/Coordinates';

interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiresAt: Date;
}

export class InMemoryWeatherRepository implements IWeatherRepository {
  private currentWeatherCache = new Map<string, CacheEntry<WeatherData>>();
  private forecastCache = new Map<string, CacheEntry<WeatherForecast>>();
  
  private readonly defaultWeatherTtlMinutes = 30;
  private readonly defaultForecastTtlHours = 6;

  async findCurrentWeatherByCity(city: City): Promise<WeatherData | null> {
    const key = this.getCityKey(city);
    return this.getCachedWeatherData(key);
  }

  async findCurrentWeatherByCoordinates(coordinates: Coordinates): Promise<WeatherData | null> {
    const key = this.getCoordinatesKey(coordinates);
    return this.getCachedWeatherData(key);
  }

  async saveCurrentWeather(weatherData: WeatherData): Promise<void> {
    const cityKey = this.getCityKey(weatherData.city);
    const coordKey = this.getCoordinatesKey(weatherData.coordinates);
    
    const entry: CacheEntry<WeatherData> = {
      data: weatherData,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.defaultWeatherTtlMinutes * 60 * 1000)
    };

    this.currentWeatherCache.set(cityKey, entry);
    this.currentWeatherCache.set(coordKey, entry);
  }

  async findForecastByCity(city: City, days?: number): Promise<WeatherForecast | null> {
    const key = this.getForecastKey(this.getCityKey(city), days);
    return this.getCachedForecast(key);
  }

  async findForecastByCoordinates(coordinates: Coordinates, days?: number): Promise<WeatherForecast | null> {
    const key = this.getForecastKey(this.getCoordinatesKey(coordinates), days);
    return this.getCachedForecast(key);
  }

  async saveForecast(forecast: WeatherForecast): Promise<void> {
    const cityKey = this.getCityKey(forecast.city);
    const coordKey = this.getCoordinatesKey(forecast.coordinates);
    const days = forecast.periods.length;
    
    const entry: CacheEntry<WeatherForecast> = {
      data: forecast,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + this.defaultForecastTtlHours * 60 * 60 * 1000)
    };

    this.forecastCache.set(this.getForecastKey(cityKey, days), entry);
    this.forecastCache.set(this.getForecastKey(coordKey, days), entry);
  }

  async clearStaleWeatherData(maxAgeMinutes: number = this.defaultWeatherTtlMinutes): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let removedCount = 0;

    for (const [key, entry] of this.currentWeatherCache.entries()) {
      if (entry.timestamp < cutoffTime || Date.now() > entry.expiresAt.getTime()) {
        this.currentWeatherCache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  async clearStaleForecast(maxAgeHours: number = this.defaultForecastTtlHours): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [key, entry] of this.forecastCache.entries()) {
      if (entry.timestamp < cutoffTime || Date.now() > entry.expiresAt.getTime()) {
        this.forecastCache.delete(key);
        removedCount++;
      }
    }

    return removedCount;
  }

  async findMultipleCitiesWeather(cities: City[]): Promise<WeatherData[]> {
    const results: WeatherData[] = [];
    
    for (const city of cities) {
      const weatherData = await this.findCurrentWeatherByCity(city);
      if (weatherData) {
        results.push(weatherData);
      }
    }

    return results;
  }

  async saveMultipleWeatherData(weatherData: WeatherData[]): Promise<void> {
    const promises = weatherData.map(data => this.saveCurrentWeather(data));
    await Promise.all(promises);
  }

  private getCachedWeatherData(key: string): WeatherData | null {
    const entry = this.currentWeatherCache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      this.currentWeatherCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private getCachedForecast(key: string): WeatherForecast | null {
    const entry = this.forecastCache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt.getTime()) {
      this.forecastCache.delete(key);
      return null;
    }

    return entry.data;
  }

  private getCityKey(city: City): string {
    return `city:${city.toString().toLowerCase().replace(/\s+/g, '_')}`;
  }

  private getCoordinatesKey(coordinates: Coordinates): string {
    const lat = coordinates.getLatitude().toFixed(4);
    const lon = coordinates.getLongitude().toFixed(4);
    return `coord:${lat},${lon}`;
  }

  private getForecastKey(locationKey: string, days?: number): string {
    return `forecast:${locationKey}:${days || 5}d`;
  }

  getCacheStats(): {
    currentWeatherEntries: number;
    forecastEntries: number;
    totalMemoryUsage: string;
  } {
    return {
      currentWeatherEntries: this.currentWeatherCache.size,
      forecastEntries: this.forecastCache.size,
      totalMemoryUsage: `${this.currentWeatherCache.size + this.forecastCache.size} entries`
    };
  }

  clearAllCache(): void {
    this.currentWeatherCache.clear();
    this.forecastCache.clear();
  }
}
