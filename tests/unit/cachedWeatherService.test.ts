import { CachedWeatherService } from '../../src/services/CachedWeatherService';
import { WeatherService } from '../../src/services/weatherService';
import { RedisCache } from '../../src/utils/cache/RedisCache';
import { PrometheusMetrics } from '../../src/utils/metrics/PrometheusMetrics';
import { IWeatherData } from '../../src/interfaces/weather/IWeatherData';

// Mock dependencies
jest.mock('../../src/services/weatherService');
jest.mock('../../src/utils/cache/RedisCache');
jest.mock('../../src/utils/metrics/PrometheusMetrics');
jest.mock('../../src/utils/weatherProviders/WeatherProviderChain');

describe('CachedWeatherService', () => {
  let cachedWeatherService: CachedWeatherService;
  let mockWeatherService: jest.Mocked<WeatherService>;
  let mockCache: jest.Mocked<RedisCache>;
  let mockMetrics: jest.Mocked<PrometheusMetrics>;
  let mockWeatherData: IWeatherData;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWeatherData = {
      temperature: 20,
      description: 'Sunny',
      humidity: 60,
      pressure: 1013,
    };

    mockWeatherService = new WeatherService({} as any) as jest.Mocked<WeatherService>;
    mockWeatherService.getWeather.mockResolvedValue(mockWeatherData);

    mockMetrics = new PrometheusMetrics() as jest.Mocked<PrometheusMetrics>;
    mockMetrics.recordRequest.mockReturnValue();
    mockMetrics.recordCacheHit.mockReturnValue();
    mockMetrics.recordCacheMiss.mockReturnValue();
    mockMetrics.recordCacheSet.mockReturnValue();
    mockMetrics.getCacheMetricsSummary.mockResolvedValue({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    });
    mockMetrics.getMetricsAsJson.mockResolvedValue({});

    mockCache = new RedisCache(
      { host: 'localhost', port: 6379 },
      mockMetrics
    ) as jest.Mocked<RedisCache>;
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue();
    mockCache.delete.mockResolvedValue();
    mockCache.clear.mockResolvedValue();
    mockCache.getCacheMetrics.mockResolvedValue({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    });

    cachedWeatherService = new CachedWeatherService(
      mockWeatherService,
      mockCache,
      mockMetrics
    );
  });

  describe('getWeather', () => {
    it('should return cached data when available', async () => {
      const cachedData: IWeatherData = {
        temperature: 18,
        description: 'Cloudy',
        humidity: 70,
        pressure: 1010,
      };
      mockCache.get.mockResolvedValue(cachedData);

      const result = await cachedWeatherService.getWeather('London');

      expect(mockCache.get).toHaveBeenCalledWith('London');
      expect(mockWeatherService.getWeather).not.toHaveBeenCalled();
      expect(result).toEqual(cachedData);
      expect(mockMetrics.recordRequest).toHaveBeenCalledWith('GET', '/api/weather/:city', true, expect.any(Number));
      expect(mockMetrics.recordCacheHit).toHaveBeenCalledWith('redis');
    });

    it('should fetch from weather service and cache when not in cache', async () => {
      const result = await cachedWeatherService.getWeather('London');

      expect(mockCache.get).toHaveBeenCalledWith('London');
      expect(mockWeatherService.getWeather).toHaveBeenCalledWith('London');
      expect(mockCache.set).toHaveBeenCalledWith('London', mockWeatherData);
      expect(result).toEqual(mockWeatherData);
      expect(mockMetrics.recordRequest).toHaveBeenCalledWith('GET', '/api/weather/:city', true, expect.any(Number));
      expect(mockMetrics.recordCacheMiss).toHaveBeenCalledWith('redis');
      expect(mockMetrics.recordCacheSet).toHaveBeenCalledWith('redis');
    });

    it('should handle errors and record failed requests', async () => {
      const error = new Error('Weather service error');
      mockWeatherService.getWeather.mockRejectedValue(error);

      await expect(cachedWeatherService.getWeather('London')).rejects.toThrow('Weather service error');

      expect(mockMetrics.recordRequest).toHaveBeenCalledWith('GET', '/api/weather/:city', false, expect.any(Number), 'Error');
      expect(mockMetrics.recordCacheMiss).toHaveBeenCalledWith('redis');
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'));

      const result = await cachedWeatherService.getWeather('London');

      expect(mockWeatherService.getWeather).toHaveBeenCalledWith('London');
      expect(mockCache.set).toHaveBeenCalledWith('London', mockWeatherData);
      expect(result).toEqual(mockWeatherData);
      expect(mockMetrics.recordCacheError).toHaveBeenCalledWith('redis', 'get_error');
    });
  });

  describe('refreshCache', () => {
    it('should fetch fresh data and update cache', async () => {
      await cachedWeatherService.refreshCache('London');

      expect(mockWeatherService.getWeather).toHaveBeenCalledWith('London');
      expect(mockCache.set).toHaveBeenCalledWith('London', mockWeatherData);
      expect(mockMetrics.recordCacheSet).toHaveBeenCalledWith('redis');
    });

    it('should handle errors during cache refresh', async () => {
      const error = new Error('Refresh error');
      mockWeatherService.getWeather.mockRejectedValue(error);

      await expect(cachedWeatherService.refreshCache('London')).rejects.toThrow('Refresh error');
    });
  });

  describe('clearCache', () => {
    it('should clear specific city cache', async () => {
      await cachedWeatherService.clearCache('London');

      expect(mockCache.delete).toHaveBeenCalledWith('London');
      expect(mockMetrics.recordCacheDelete).toHaveBeenCalledWith('redis');
    });

    it('should clear all cache when no city specified', async () => {
      await cachedWeatherService.clearCache();

      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('metrics', () => {
    it('should return cache metrics', async () => {
      const cacheMetrics = {
        hits: 5,
        misses: 3,
        sets: 8,
        deletes: 1,
        errors: 0,
      };
      mockCache.getCacheMetrics.mockResolvedValue(cacheMetrics);

      const result = await cachedWeatherService.getCacheMetrics();

      expect(result).toEqual(cacheMetrics);
    });

    it('should return application metrics', async () => {
      const appMetrics = {
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
        averageResponseTime: 150,
      };
      mockMetrics.getMetricsAsJson.mockResolvedValue(appMetrics);

      const result = await cachedWeatherService.getMetricsAsJson();

      expect(result).toEqual(appMetrics);
    });
  });
});
