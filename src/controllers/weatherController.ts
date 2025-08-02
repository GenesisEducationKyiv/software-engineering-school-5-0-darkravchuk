import { Request, Response } from 'express';
import {IWeatherService} from '../services/WeatherService.interface';
import {BadRequestError} from '../errors/httpError';
import { CachedWeatherService } from '../services/CachedWeatherService';
import {IWeatherParams} from '../interfaces/weather/IWeatherParams';

export class WeatherController {
  private weatherService: IWeatherService;

  constructor(weatherService: IWeatherService) {
    this.weatherService = weatherService;
  }

  async getWeather(req: Request<IWeatherParams>, res: Response) {
    const { city } = req.params;

    if (!city) {
      throw new BadRequestError('City parameter is required');
    }
    const weatherData = await this.weatherService.getWeather(city);
    res.status(200).json({
      city,
      temperature: weatherData.temperature,
      description: weatherData.description,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure
    });
  }

  async getProviderStatus(req: Request, res: Response) {
    try {
      // Access the provider chain to get status
      const providerChain = (this.weatherService as any).weatherProvider;
      if (providerChain && typeof providerChain.getProviderStatus === 'function') {
        const status = providerChain.getProviderStatus();
        res.status(200).json({ providers: status });
      } else {
        res.status(200).json({
          providers: [{
            name: 'weather-provider',
            available: true
          }]
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get provider status' });
    }
  }

  async getCacheMetrics(req: Request, res: Response) {
    try {
      if (this.weatherService instanceof CachedWeatherService) {
        const cacheMetrics = await this.weatherService.getCacheMetrics();
        const applicationMetrics = await this.weatherService.getApplicationMetrics();
        
        res.status(200).json({
          cache: cacheMetrics,
          application: applicationMetrics,
          cacheHitRate: this.calculateCacheHitRate(cacheMetrics),
          successRate: this.calculateSuccessRate(applicationMetrics)
        });
      } else {
        res.status(404).json({ error: 'Cache metrics not available' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get cache metrics' });
    }
  }

  async getPrometheusMetrics(req: Request, res: Response) {
    try {
      if (this.weatherService instanceof CachedWeatherService) {
        const metrics = await this.weatherService.getPrometheusMetrics();
        res.set('Content-Type', 'text/plain');
        res.status(200).send(metrics);
      } else {
        res.status(404).json({ error: 'Prometheus metrics not available' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get Prometheus metrics' });
    }
  }

  async refreshCache(req: Request<{ city: string }>, res: Response) {
    try {
      const { city } = req.params;
      
      if (!city) {
        throw new BadRequestError('City parameter is required');
      }

      if (this.weatherService instanceof CachedWeatherService) {
        await this.weatherService.refreshCache(city);
        res.status(200).json({ message: `Cache refreshed for ${city}` });
      } else {
        res.status(404).json({ error: 'Cache not available' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to refresh cache' });
    }
  }

  async clearCache(req: Request, res: Response) {
    try {
      const { city } = req.query;
      
      if (this.weatherService instanceof CachedWeatherService) {
        if (city && typeof city === 'string') {
          await this.weatherService.clearCache(city);
          res.status(200).json({ message: `Cache cleared for ${city}` });
        } else {
          await this.weatherService.clearCache();
          res.status(200).json({ message: 'All cache cleared' });
        }
      } else {
        res.status(404).json({ error: 'Cache not available' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }

  async getMetricsReport(req: Request, res: Response) {
    try {
      if (this.weatherService instanceof CachedWeatherService) {
        const metrics = await this.weatherService.getMetricsAsJson();
        res.status(200).json({ metrics });
      } else {
        res.status(404).json({ error: 'Metrics report not available' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate metrics report' });
    }
  }

  private calculateCacheHitRate(cacheMetrics: any): number {
    const total = cacheMetrics.hits + cacheMetrics.misses;
    if (total === 0) return 0;
    return (cacheMetrics.hits / total) * 100;
  }

  private calculateSuccessRate(applicationMetrics: any): number {
    if (applicationMetrics.totalRequests === 0) return 0;
    return (applicationMetrics.successfulRequests / applicationMetrics.totalRequests) * 100;
  }
}
