import { IWeatherService } from './WeatherService.interface';
import { WeatherDataDTO } from './WeatherDataDTO';
import { RedisCache } from '../utils/cache/RedisCache';
import { PrometheusMetrics } from '../utils/metrics/PrometheusMetrics';

export class CachedWeatherService implements IWeatherService {
  constructor(
    private weatherService: IWeatherService,
    private cache: RedisCache,
    private metrics: PrometheusMetrics
  ) {}

  async getWeather(city: string): Promise<WeatherDataDTO> {
    const startTime = Date.now();
    
    try {
      // Try to get from cache first
      const cachedData = await this.cache.get(city);
      
      if (cachedData) {
        const responseTime = Date.now() - startTime;
        this.metrics.recordRequest('GET', '/api/weather/:city', true, responseTime);
        
        console.log(`Cache HIT for ${city}`);
        return cachedData;
      }

      console.log(`Cache MISS for ${city}`);
      
      // If not in cache, fetch from weather service
      const weatherData = await this.weatherService.getWeather(city);
      
      // Store in cache for future requests
      await this.cache.set(city, weatherData);
      
      const responseTime = Date.now() - startTime;
      this.metrics.recordRequest('GET', '/api/weather/:city', true, responseTime);
      
      return weatherData;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorType = error instanceof Error ? error.constructor.name : 'unknown';
      this.metrics.recordRequest('GET', '/api/weather/:city', false, responseTime, errorType);
      
      throw error;
    }
  }

  async refreshCache(city: string): Promise<void> {
    try {
      // Fetch fresh data
      const weatherData = await this.weatherService.getWeather(city);
      
      // Update cache
      await this.cache.set(city, weatherData);
      
      console.log(`Cache refreshed for ${city}`);
    } catch (error) {
      console.error(`Failed to refresh cache for ${city}:`, error);
      throw error;
    }
  }

  async clearCache(city?: string): Promise<void> {
    if (city) {
      await this.cache.delete(city);
      console.log(`Cache cleared for ${city}`);
    } else {
      await this.cache.clear();
      console.log('All cache cleared');
    }
  }

  async getCacheMetrics() {
    return await this.cache.getMetrics();
  }

  async getApplicationMetrics() {
    return await this.metrics.getApplicationMetricsSummary();
  }

  async getPrometheusMetrics(): Promise<string> {
    return await this.metrics.getMetrics();
  }

  async getMetricsAsJson(): Promise<any> {
    return await this.metrics.getMetricsAsJson();
  }
} 