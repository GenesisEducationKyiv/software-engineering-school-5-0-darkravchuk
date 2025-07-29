import { PrometheusMetrics } from '../../src/utils/metrics/PrometheusMetrics';

describe('PrometheusMetrics', () => {
  let metrics: PrometheusMetrics;

  beforeEach(() => {
    metrics = new PrometheusMetrics();
  });

  afterEach(() => {
    metrics.resetMetrics();
  });

  describe('Application Metrics', () => {
    it('should record successful requests', () => {
      metrics.recordRequest('GET', '/api/weather/:city', true, 150);
      
      const summary = metrics.getApplicationMetricsSummary();
      expect(summary.totalRequests).toBe(1);
      expect(summary.successfulRequests).toBe(1);
      expect(summary.failedRequests).toBe(0);
    });

    it('should record failed requests', () => {
      metrics.recordRequest('GET', '/api/weather/:city', false, 200, 'TimeoutError');
      
      const summary = metrics.getApplicationMetricsSummary();
      expect(summary.totalRequests).toBe(1);
      expect(summary.successfulRequests).toBe(0);
      expect(summary.failedRequests).toBe(1);
    });

    it('should calculate average response time', () => {
      metrics.recordRequest('GET', '/api/weather/:city', true, 100);
      metrics.recordRequest('GET', '/api/weather/:city', true, 200);
      metrics.recordRequest('GET', '/api/weather/:city', true, 300);
      
      const summary = metrics.getApplicationMetricsSummary();
      expect(summary.averageResponseTime).toBe(200);
    });
  });

  describe('Cache Metrics', () => {
    it('should record cache hits and misses', () => {
      metrics.recordCacheHit('redis');
      metrics.recordCacheHit('redis');
      metrics.recordCacheMiss('redis');
      
      const summary = metrics.getCacheMetricsSummary();
      expect(summary.hits).toBe(2);
      expect(summary.misses).toBe(1);
    });

    it('should record cache operations', () => {
      metrics.recordCacheSet('redis');
      metrics.recordCacheSet('redis');
      metrics.recordCacheDelete('redis');
      
      const summary = metrics.getCacheMetricsSummary();
      expect(summary.sets).toBe(2);
      expect(summary.deletes).toBe(1);
    });

    it('should record cache errors', () => {
      metrics.recordCacheError('redis', 'connection_error');
      metrics.recordCacheError('redis', 'timeout_error');
      
      const summary = metrics.getCacheMetricsSummary();
      expect(summary.errors).toBe(2);
    });
  });

  describe('Weather Provider Metrics', () => {
    it('should record provider requests', () => {
      metrics.recordProviderRequest('weatherapi.com', true, 120);
      metrics.recordProviderRequest('openweathermap.org', false, 500, 'timeout');
      
      // Note: Prometheus metrics are cumulative, so we can't easily test individual values
      // This test ensures the methods don't throw errors
      expect(() => {
        metrics.recordProviderRequest('accuweather.com', true, 200);
      }).not.toThrow();
    });
  });

  describe('Metrics Export', () => {
    it('should export metrics in Prometheus format', async () => {
      // Record some metrics
      metrics.recordRequest('GET', '/api/weather/:city', true, 150);
      metrics.recordCacheHit('redis');
      metrics.recordCacheMiss('redis');
      
      const prometheusMetrics = await metrics.getMetrics();
      
      expect(prometheusMetrics).toContain('# HELP weather_app_requests_total');
      expect(prometheusMetrics).toContain('# TYPE weather_app_requests_total counter');
      expect(prometheusMetrics).toContain('# HELP weather_cache_hits_total');
      expect(prometheusMetrics).toContain('# TYPE weather_cache_hits_total counter');
    });

    it('should export metrics as JSON', async () => {
      metrics.recordRequest('GET', '/api/weather/:city', true, 150);
      
      const jsonMetrics = await metrics.getMetricsAsJson();
      
      expect(jsonMetrics).toBeInstanceOf(Array);
      expect(jsonMetrics.length).toBeGreaterThan(0);
      
      // Check for specific metric types
      const metricNames = jsonMetrics.map((metric: any) => metric.name);
      expect(metricNames).toContain('weather_app_requests_total');
      expect(metricNames).toContain('weather_cache_hits_total');
    });
  });

  describe('System Metrics', () => {
    it('should collect system metrics', () => {
      // System metrics are collected automatically via setInterval
      // This test ensures the metrics exist
      const uptime = metrics.uptime;
      const memoryUsage = metrics.memoryUsage;
      
      expect(uptime).toBeDefined();
      expect(memoryUsage).toBeDefined();
    });
  });

  describe('Metrics Reset', () => {
    it('should reset all metrics', () => {
      // Record some metrics
      metrics.recordRequest('GET', '/api/weather/:city', true, 150);
      metrics.recordCacheHit('redis');
      
      // Reset metrics
      metrics.resetMetrics();
      
      const appSummary = metrics.getApplicationMetricsSummary();
      const cacheSummary = metrics.getCacheMetricsSummary();
      
      expect(appSummary.totalRequests).toBe(0);
      expect(cacheSummary.hits).toBe(0);
    });
  });
}); 