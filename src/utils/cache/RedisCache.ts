import Redis from 'ioredis';
import { WeatherDataDTO } from '../../services/WeatherDataDTO';
import { PrometheusMetrics } from '../metrics/PrometheusMetrics';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl?: number; // Time to live in seconds
}

export interface CacheMetrics {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
}

export class RedisCache {
  private client: Redis;
  private ttl: number;
  private metrics: PrometheusMetrics;

  constructor(config: CacheConfig, metrics: PrometheusMetrics) {
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.ttl = config.ttl || 300; // Default 5 minutes
    this.metrics = metrics;

    this.client.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
      this.metrics.recordCacheError('redis', 'connection_error');
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  private generateKey(city: string): string {
    return `weather:${city.toLowerCase()}`;
  }

  async get(city: string): Promise<WeatherDataDTO | null> {
    try {
      const key = this.generateKey(city);
      const cached = await this.client.get(key);
      
      if (cached) {
        this.metrics.recordCacheHit('redis');
        const data = JSON.parse(cached);
        return new WeatherDataDTO(
          data.temperature,
          data.description,
          data.humidity,
          data.pressure
        );
      } else {
        this.metrics.recordCacheMiss('redis');
        return null;
      }
    } catch (error) {
      this.metrics.recordCacheError('redis', 'get_error');
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(city: string, weatherData: WeatherDataDTO): Promise<void> {
    try {
      const key = this.generateKey(city);
      const data = {
        temperature: weatherData.temperature,
        description: weatherData.description,
        humidity: weatherData.humidity,
        pressure: weatherData.pressure,
        cachedAt: new Date().toISOString()
      };

      await this.client.setex(key, this.ttl, JSON.stringify(data));
      this.metrics.recordCacheSet('redis');
    } catch (error) {
      this.metrics.recordCacheError('redis', 'set_error');
      console.error('Cache set error:', error);
    }
  }

  async delete(city: string): Promise<void> {
    try {
      const key = this.generateKey(city);
      await this.client.del(key);
      this.metrics.recordCacheDelete('redis');
    } catch (error) {
      this.metrics.recordCacheError('redis', 'delete_error');
      console.error('Cache delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.client.keys('weather:*');
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      this.metrics.recordCacheError('redis', 'clear_error');
      console.error('Cache clear error:', error);
    }
  }

  async getMetrics(): Promise<CacheMetrics> {
    return await this.metrics.getCacheMetricsSummary();
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
} 