import { CacheMetrics } from '../cache/RedisCache';

export interface ApplicationMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheMetrics: CacheMetrics;
  weatherProviderMetrics: {
    [provider: string]: {
      requests: number;
      successes: number;
      failures: number;
      averageResponseTime: number;
    };
  };
}

export class MetricsCollector {
  private metrics: ApplicationMetrics;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheMetrics: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      },
      weatherProviderMetrics: {}
    };
  }

  recordRequest(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / this.metrics.totalRequests;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
  }

  updateCacheMetrics(cacheMetrics: CacheMetrics): void {
    this.metrics.cacheMetrics = { ...cacheMetrics };
  }

  recordWeatherProviderRequest(provider: string, success: boolean, responseTime: number): void {
    if (!this.metrics.weatherProviderMetrics[provider]) {
      this.metrics.weatherProviderMetrics[provider] = {
        requests: 0,
        successes: 0,
        failures: 0,
        averageResponseTime: 0
      };
    }

    const providerMetrics = this.metrics.weatherProviderMetrics[provider];
    providerMetrics.requests++;
    providerMetrics.averageResponseTime = 
      (providerMetrics.averageResponseTime * (providerMetrics.requests - 1) + responseTime) / providerMetrics.requests;

    if (success) {
      providerMetrics.successes++;
    } else {
      providerMetrics.failures++;
    }
  }

  getMetrics(): ApplicationMetrics {
    return { ...this.metrics };
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 0;
    return (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  getCacheHitRate(): number {
    const total = this.metrics.cacheMetrics.hits + this.metrics.cacheMetrics.misses;
    if (total === 0) return 0;
    return (this.metrics.cacheMetrics.hits / total) * 100;
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheMetrics: {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0
      },
      weatherProviderMetrics: {}
    };
    this.startTime = Date.now();
  }

  generateReport(): string {
    const uptime = this.getUptime();
    const successRate = this.getSuccessRate();
    const cacheHitRate = this.getCacheHitRate();

    return `
=== Application Metrics Report ===
Uptime: ${Math.floor(uptime / 1000)}s
Total Requests: ${this.metrics.totalRequests}
Success Rate: ${successRate.toFixed(2)}%
Average Response Time: ${this.metrics.averageResponseTime.toFixed(2)}ms

=== Cache Metrics ===
Hit Rate: ${cacheHitRate.toFixed(2)}%
Hits: ${this.metrics.cacheMetrics.hits}
Misses: ${this.metrics.cacheMetrics.misses}
Sets: ${this.metrics.cacheMetrics.sets}
Deletes: ${this.metrics.cacheMetrics.deletes}
Errors: ${this.metrics.cacheMetrics.errors}

=== Weather Provider Metrics ===
${Object.entries(this.metrics.weatherProviderMetrics)
  .map(([provider, metrics]) => `
${provider}:
  Requests: ${metrics.requests}
  Success Rate: ${metrics.requests > 0 ? ((metrics.successes / metrics.requests) * 100).toFixed(2) : 0}%
  Average Response Time: ${metrics.averageResponseTime.toFixed(2)}ms
`).join('')}
================================
`;
  }
} 