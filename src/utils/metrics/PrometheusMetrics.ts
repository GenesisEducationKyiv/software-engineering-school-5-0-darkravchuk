import {Counter, Gauge, Histogram, Registry} from 'prom-client';

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

// Define label names as an enum to prevent typos
enum MetricLabels {
  METHOD = 'method',
  ENDPOINT = 'endpoint',
  ERROR_TYPE = 'error_type',
  CACHE_TYPE = 'cache_type',
  PROVIDER = 'provider',
  TYPE = 'type',
}

// Define histogram buckets as a constant
const HISTOGRAM_BUCKETS = [0.1, 0.5, 1, 2, 5, 10];

export class PrometheusMetrics {
  private registry: Registry;

  // Application metrics
  public totalRequests: Counter;
  public successfulRequests: Counter;
  public failedRequests: Counter;
  public responseTime: Histogram;

  // Cache metrics
  public cacheHits: Counter;
  public cacheMisses: Counter;
  public cacheSets: Counter;
  public cacheDeletes: Counter;
  public cacheErrors: Counter;
  public cacheHitRate: Gauge;

  // Weather provider metrics
  public providerRequests: Counter;
  public providerSuccesses: Counter;
  public providerFailures: Counter;
  public providerResponseTime: Histogram;

  // System metrics
  public uptime: Gauge;
  public activeConnections: Gauge;
  public memoryUsage: Gauge;

  constructor() {
    this.registry = new Registry();

    // Application metrics
    this.totalRequests = new Counter({
      name: 'weather_app_requests_total',
      help: 'Total number of weather requests',
      labelNames: [MetricLabels.METHOD, MetricLabels.ENDPOINT],
    });

    this.successfulRequests = new Counter({
      name: 'weather_app_successful_requests_total',
      help: 'Total number of successful weather requests',
      labelNames: [MetricLabels.METHOD, MetricLabels.ENDPOINT],
    });

    this.failedRequests = new Counter({
      name: 'weather_app_failed_requests_total',
      help: 'Total number of failed weather requests',
      labelNames: [MetricLabels.METHOD, MetricLabels.ENDPOINT, MetricLabels.ERROR_TYPE],
    });

    this.responseTime = new Histogram({
      name: 'weather_app_response_time_seconds',
      help: 'Response time in seconds',
      labelNames: [MetricLabels.METHOD, MetricLabels.ENDPOINT],
      buckets: HISTOGRAM_BUCKETS,
    });

    // Cache metrics
    this.cacheHits = new Counter({
      name: 'weather_cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: [MetricLabels.CACHE_TYPE],
    });

    this.cacheMisses = new Counter({
      name: 'weather_cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: [MetricLabels.CACHE_TYPE],
    });

    this.cacheSets = new Counter({
      name: 'weather_cache_sets_total',
      help: 'Total number of cache sets',
      labelNames: [MetricLabels.CACHE_TYPE],
    });

    this.cacheDeletes = new Counter({
      name: 'weather_cache_deletes_total',
      help: 'Total number of cache deletes',
      labelNames: [MetricLabels.CACHE_TYPE],
    });

    this.cacheErrors = new Counter({
      name: 'weather_cache_errors_total',
      help: 'Total number of cache errors',
      labelNames: [MetricLabels.CACHE_TYPE, MetricLabels.ERROR_TYPE],
    });

    this.cacheHitRate = new Gauge({
      name: 'weather_cache_hit_rate',
      help: 'Cache hit rate percentage',
      labelNames: [MetricLabels.CACHE_TYPE],
    });

    // Weather provider metrics
    this.providerRequests = new Counter({
      name: 'weather_provider_requests_total',
      help: 'Total number of weather provider requests',
      labelNames: [MetricLabels.PROVIDER],
    });

    this.providerSuccesses = new Counter({
      name: 'weather_provider_successes_total',
      help: 'Total number of successful weather provider requests',
      labelNames: [MetricLabels.PROVIDER],
    });

    this.providerFailures = new Counter({
      name: 'weather_provider_failures_total',
      help: 'Total number of failed weather provider requests',
      labelNames: [MetricLabels.PROVIDER, MetricLabels.ERROR_TYPE],
    });

    this.providerResponseTime = new Histogram({
      name: 'weather_provider_response_time_seconds',
      help: 'Weather provider response time in seconds',
      labelNames: [MetricLabels.PROVIDER],
      buckets: HISTOGRAM_BUCKETS,
    });

    // System metrics
    this.uptime = new Gauge({
      name: 'weather_app_uptime_seconds',
      help: 'Application uptime in seconds',
    });

    this.activeConnections = new Gauge({
      name: 'weather_app_active_connections',
      help: 'Number of active connections',
    });

    this.memoryUsage = new Gauge({
      name: 'weather_app_memory_usage_bytes',
      help: 'Memory usage in bytes',
      labelNames: [MetricLabels.TYPE],
    });

    // Register all metrics
    this.registry.registerMetric(this.totalRequests);
    this.registry.registerMetric(this.successfulRequests);
    this.registry.registerMetric(this.failedRequests);
    this.registry.registerMetric(this.responseTime);
    this.registry.registerMetric(this.cacheHits);
    this.registry.registerMetric(this.cacheMisses);
    this.registry.registerMetric(this.cacheSets);
    this.registry.registerMetric(this.cacheDeletes);
    this.registry.registerMetric(this.cacheErrors);
    this.registry.registerMetric(this.cacheHitRate);
    this.registry.registerMetric(this.providerRequests);
    this.registry.registerMetric(this.providerSuccesses);
    this.registry.registerMetric(this.providerFailures);
    this.registry.registerMetric(this.providerResponseTime);
    this.registry.registerMetric(this.uptime);
    this.registry.registerMetric(this.activeConnections);
    this.registry.registerMetric(this.memoryUsage);

    // Start system metrics collection
    this.startSystemMetricsCollection();
  }

  // Application metrics methods
  recordRequest(method: string, endpoint: string, success: boolean, responseTimeMs: number, errorType?: string): void {
    this.totalRequests.inc({ [MetricLabels.METHOD]: method, [MetricLabels.ENDPOINT]: endpoint });

    if (success) {
      this.successfulRequests.inc({ [MetricLabels.METHOD]: method, [MetricLabels.ENDPOINT]: endpoint });
    } else {
      this.failedRequests.inc({ [MetricLabels.METHOD]: method, [MetricLabels.ENDPOINT]: endpoint, [MetricLabels.ERROR_TYPE]: errorType || 'unknown' });
    }

    this.responseTime.observe({ [MetricLabels.METHOD]: method, [MetricLabels.ENDPOINT]: endpoint }, responseTimeMs / 1000);
  }

  // Cache metrics methods
  recordCacheHit(cacheType: string = 'redis'): void {
    this.cacheHits.inc({ [MetricLabels.CACHE_TYPE]: cacheType });
    this.updateCacheHitRate(cacheType);
  }

  recordCacheMiss(cacheType: string = 'redis'): void {
    this.cacheMisses.inc({ [MetricLabels.CACHE_TYPE]: cacheType });
    this.updateCacheHitRate(cacheType);
  }

  recordCacheSet(cacheType: string = 'redis'): void {
    this.cacheSets.inc({ [MetricLabels.CACHE_TYPE]: cacheType });
  }

  recordCacheDelete(cacheType: string = 'redis'): void {
    this.cacheDeletes.inc({ [MetricLabels.CACHE_TYPE]: cacheType });
  }

  recordCacheError(cacheType: string = 'redis', errorType: string = 'unknown'): void {
    this.cacheErrors.inc({ [MetricLabels.CACHE_TYPE]: cacheType, [MetricLabels.ERROR_TYPE]: errorType });
  }

  private async updateCacheHitRate(cacheType: string): Promise<void> {
    const hits = await this.cacheHits.get();
    const misses = await this.cacheMisses.get();
    const hitsValue = hits.values && hits.values.length > 0 ? hits.values[0].value : 0;
    const missesValue = misses.values && misses.values.length > 0 ? misses.values[0].value : 0;
    const total = hitsValue + missesValue;

    this.cacheHitRate.set({ [MetricLabels.CACHE_TYPE]: cacheType }, total > 0 ? (hitsValue / total) * 100 : 0);
  }

  // Weather provider metrics methods
  recordProviderRequest(provider: string, success: boolean, responseTimeMs: number, errorType?: string): void {
    this.providerRequests.inc({ [MetricLabels.PROVIDER]: provider });

    if (success) {
      this.providerSuccesses.inc({ [MetricLabels.PROVIDER]: provider });
    } else {
      this.providerFailures.inc({ [MetricLabels.PROVIDER]: provider, [MetricLabels.ERROR_TYPE]: errorType || 'unknown' });
    }

    this.providerResponseTime.observe({ [MetricLabels.PROVIDER]: provider }, responseTimeMs / 1000);
  }

  // System metrics methods
  private startSystemMetricsCollection(): void {
    // Update uptime every 30 seconds
    setInterval(() => {
      this.uptime.set(process.uptime());
    }, 30000);

    // Update memory usage every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.memoryUsage.set({ [MetricLabels.TYPE]: 'rss' }, memUsage.rss);
      this.memoryUsage.set({ [MetricLabels.TYPE]: 'heap_used' }, memUsage.heapUsed);
      this.memoryUsage.set({ [MetricLabels.TYPE]: 'heap_total' }, memUsage.heapTotal);
      this.memoryUsage.set({ [MetricLabels.TYPE]: 'external' }, memUsage.external);
    }, 30000);
  }

  // Metrics retrieval
  async getMetrics(): Promise<string> {
    return await this.registry.metrics();
  }

  async getMetricsAsJson(): Promise<any> {
    return await this.registry.getMetricsAsJSON();
  }

  // Reset metrics (useful for testing)
  resetMetrics(): void {
    this.registry.clear();
  }

  // Get cache metrics summary
  async getCacheMetricsSummary(): Promise<CacheMetrics> {
    try {
      const hits = await this.cacheHits.get();
      const misses = await this.cacheMisses.get();
      const sets = await this.cacheSets.get();
      const deletes = await this.cacheDeletes.get();
      const errors = await this.cacheErrors.get();

      // Extract values from the metric objects
      const hitsValue = hits.values && hits.values.length > 0 ? hits.values[0].value : 0;
      const missesValue = misses.values && misses.values.length > 0 ? misses.values[0].value : 0;
      const setsValue = sets.values && sets.values.length > 0 ? sets.values[0].value : 0;
      const deletesValue = deletes.values && deletes.values.length > 0 ? deletes.values[0].value : 0;
      const errorsValue = errors.values && errors.values.length > 0 ? errors.values[0].value : 0;

      return {
        hits: hitsValue,
        misses: missesValue,
        sets: setsValue,
        deletes: deletesValue,
        errors: errorsValue,
      };
    } catch (error) {
      console.error('Error getting cache metrics summary:', error);
      return {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
      };
    }
  }

  // Get application metrics summary
  async getApplicationMetricsSummary(): Promise<any> {
    try {
      const totalReqs = await this.totalRequests.get();
      const successfulReqs = await this.successfulRequests.get();
      const failedReqs = await this.failedRequests.get();
      const avgResponseTime = await this.responseTime.get();

      // Extract values from the metric objects
      const totalReqsValue = totalReqs.values && totalReqs.values.length > 0 ? totalReqs.values[0].value : 0;
      const successfulReqsValue = successfulReqs.values && successfulReqs.values.length > 0 ? successfulReqs.values[0].value : 0;
      const failedReqsValue = failedReqs.values && failedReqs.values.length > 0 ? failedReqs.values[0].value : 0;
      const avgResponseTimeValue = avgResponseTime.values && avgResponseTime.values.length > 0 ? avgResponseTime.values[0].value : 0;

      return {
        totalRequests: totalReqsValue,
        successfulRequests: successfulReqsValue,
        failedRequests: failedReqsValue,
        averageResponseTime: avgResponseTimeValue,
      };
    } catch (error) {
      console.error('Error getting application metrics summary:', error);
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
      };
    }
  }
}