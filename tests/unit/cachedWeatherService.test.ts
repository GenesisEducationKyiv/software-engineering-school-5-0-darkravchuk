import { CachedWeatherService } from '../../src/services/CachedWeatherService';
import { WeatherService } from '../../src/services/weatherService';
import { RedisCache } from '../../src/utils/cache/RedisCache';
import { MetricsCollector } from '../../src/utils/metrics/MetricsCollector';
import { WeatherDataDTO } from '../../src/services/WeatherDataDTO';
import { WeatherProviderChain } from '../../src/utils/weatherProviders/WeatherProviderChain';

// Mock dependencies
jest.mock('../../src/services/weatherService');
jest.mock('../../src/utils/cache/RedisCache');
jest.mock('../../src/utils/metrics/MetricsCollector');
jest.mock('../../src/utils/weatherProviders/WeatherProviderChain');

describe('CachedWeatherService', () => {
  let cachedWeatherService: CachedWeatherService;
  let mockWeatherService: jest.Mocked<WeatherService>;
  let mockCache: jest.Mocked<RedisCache>;
  let mockMetrics: jest.Mocked<MetricsCollector>;
  let mockWeatherData: WeatherDataDTO;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWeatherData = new WeatherDataDTO(20, 'Sunny', 60, 1013);
    
    mockWeatherService = new WeatherService({} as any) as jest.Mocked<WeatherService>;
    mockWeatherService.getWeather.mockResolvedValue(mockWeatherData);
    
    mockCache = new RedisCache({ host: 'localhost', port: 6379 }) as jest.Mocked<RedisCache>;
    mockCache.get.mockResolvedValue(null);
    mockCache.set.mockResolvedValue();
    mockCache.getMetrics.mockReturnValue({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    });
    
    mockMetrics = new MetricsCollector() as jest.Mocked<MetricsCollector>;
    mockMetrics.recordRequest.mockReturnValue();
    mockMetrics.updateCacheMetrics.mockReturnValue();
    
    cachedWeatherService = new CachedWeatherService(
      mockWeatherService,
      mockCache,
      mockMetrics
    );
  });

  describe('getWeather', () => {
    it('should return cached data when available', async () => {
      const cachedData = new WeatherDataDTO(18, 'Cloudy', 70, 1010);
      mockCache.get.mockResolvedValue(cachedData);
      
      const result = await cachedWeatherService.getWeather('London');
      
      expect(mockCache.get).toHaveBeenCalledWith('London');
      expect(mockWeatherService.getWeather).not.toHaveBeenCalled();
      expect(result).toBe(cachedData);
      expect(mockMetrics.recordRequest).toHaveBeenCalledWith(true, expect.any(Number));
    });

    it('should fetch from weather service and cache when not in cache', async () => {
      const result = await cachedWeatherService.getWeather('London');
      
      expect(mockCache.get).toHaveBeenCalledWith('London');
      expect(mockWeatherService.getWeather).toHaveBeenCalledWith('London');
      expect(mockCache.set).toHaveBeenCalledWith('London', mockWeatherData);
      expect(result).toBe(mockWeatherData);
      expect(mockMetrics.recordRequest).toHaveBeenCalledWith(true, expect.any(Number));
    });

    it('should handle errors and record failed requests', async () => {
      const error = new Error('Weather service error');
      mockWeatherService.getWeather.mockRejectedValue(error);
      
      await expect(cachedWeatherService.getWeather('London')).rejects.toThrow('Weather service error');
      
      expect(mockMetrics.recordRequest).toHaveBeenCalledWith(false, expect.any(Number));
    });

    it('should handle cache errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'));
      
      const result = await cachedWeatherService.getWeather('London');
      
      expect(mockWeatherService.getWeather).toHaveBeenCalledWith('London');
      expect(result).toBe(mockWeatherData);
    });
  });

  describe('refreshCache', () => {
    it('should fetch fresh data and update cache', async () => {
      await cachedWeatherService.refreshCache('London');
      
      expect(mockWeatherService.getWeather).toHaveBeenCalledWith('London');
      expect(mockCache.set).toHaveBeenCalledWith('London', mockWeatherData);
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
    });

    it('should clear all cache when no city specified', async () => {
      await cachedWeatherService.clearCache();
      
      expect(mockCache.clear).toHaveBeenCalled();
    });
  });

  describe('metrics', () => {
    it('should return cache metrics', () => {
      const cacheMetrics = {
        hits: 5,
        misses: 3,
        sets: 8,
        deletes: 1,
        errors: 0
      };
      mockCache.getMetrics.mockReturnValue(cacheMetrics);
      
      const result = cachedWeatherService.getCacheMetrics();
      
      expect(result).toEqual(cacheMetrics);
    });

    it('should return application metrics', () => {
      const appMetrics = {
        totalRequests: 10,
        successfulRequests: 9,
        failedRequests: 1,
        averageResponseTime: 150,
        cacheMetrics: { hits: 5, misses: 5, sets: 5, deletes: 0, errors: 0 },
        weatherProviderMetrics: {}
      };
      mockMetrics.getMetrics.mockReturnValue(appMetrics);
      
      const result = cachedWeatherService.getApplicationMetrics();
      
      expect(result).toEqual(appMetrics);
    });

    it('should generate metrics report', () => {
      const report = 'Test metrics report';
      mockMetrics.generateReport.mockReturnValue(report);
      
      const result = cachedWeatherService.generateMetricsReport();
      
      expect(result).toBe(report);
    });
  });
}); 