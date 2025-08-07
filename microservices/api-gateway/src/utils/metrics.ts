import { logger } from './logger';

export interface RequestMetrics {
  requestCount: number;
  errorCount: number;
  responseTimeSum: number;
  responseTimeCount: number;
  serviceErrors: Map<string, number>;
  statusCodes: Map<number, number>;
}

export interface ServiceHealthMetrics {
  healthyServices: number;
  totalServices: number;
  serviceStatus: Map<string, boolean>;
}

export class MetricsCollector {
  private metrics: RequestMetrics;
  private serviceHealth: ServiceHealthMetrics;
  private startTime: number;

  constructor() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimeSum: 0,
      responseTimeCount: 0,
      serviceErrors: new Map(),
      statusCodes: new Map()
    };

    this.serviceHealth = {
      healthyServices: 0,
      totalServices: 4,
      serviceStatus: new Map([
        ['subscription-service', false],
        ['weather-service', false],
        ['scheduling-service', false],
        ['notification-service', false]
      ])
    };

    this.startTime = Date.now();

    setInterval(() => {
      this.logMetrics();
    }, 5 * 60 * 1000);
  }

  recordRequest(method: string, path: string, statusCode: number, responseTime: number, service?: string) {
    this.metrics.requestCount++;
    
    const currentCount = this.metrics.statusCodes.get(statusCode) || 0;
    this.metrics.statusCodes.set(statusCode, currentCount + 1);
    
    this.metrics.responseTimeSum += responseTime;
    this.metrics.responseTimeCount++;
    
    if (statusCode >= 400) {
      this.metrics.errorCount++;
      
      if (service && statusCode >= 500) {
        const serviceErrorCount = this.metrics.serviceErrors.get(service) || 0;
        this.metrics.serviceErrors.set(service, serviceErrorCount + 1);
      }
    }

    logger.debug('Request metrics recorded', {
      method,
      path,
      statusCode,
      responseTime,
      service,
      totalRequests: this.metrics.requestCount,
      errorRate: this.getErrorRate()
    });
  }

  recordServiceHealth(serviceName: string, isHealthy: boolean) {
    const wasHealthy = this.serviceHealth.serviceStatus.get(serviceName) || false;
    this.serviceHealth.serviceStatus.set(serviceName, isHealthy);
    
    this.serviceHealth.healthyServices = Array.from(this.serviceHealth.serviceStatus.values())
      .filter(status => status).length;

    if (wasHealthy !== isHealthy) {
      if (isHealthy) {
        logger.info(`Service ${serviceName} is now healthy`, {
          serviceName,
          healthyServices: this.serviceHealth.healthyServices,
          totalServices: this.serviceHealth.totalServices
        });
      } else {
        logger.error(`Service ${serviceName} is now unhealthy`, {
          serviceName,
          healthyServices: this.serviceHealth.healthyServices,
          totalServices: this.serviceHealth.totalServices
        });
      }
    }
  }

  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTime = this.metrics.responseTimeCount > 0 
      ? this.metrics.responseTimeSum / this.metrics.responseTimeCount 
      : 0;

    return {
      uptime,
      requests: {
        total: this.metrics.requestCount,
        errors: this.metrics.errorCount,
        errorRate: this.getErrorRate(),
        averageResponseTime: Math.round(avgResponseTime * 100) / 100
      },
      services: {
        healthy: this.serviceHealth.healthyServices,
        total: this.serviceHealth.totalServices,
        healthPercentage: Math.round((this.serviceHealth.healthyServices / this.serviceHealth.totalServices) * 100),
        status: Object.fromEntries(this.serviceHealth.serviceStatus)
      },
      statusCodes: Object.fromEntries(this.metrics.statusCodes),
      serviceErrors: Object.fromEntries(this.metrics.serviceErrors),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }

  private getErrorRate(): number {
    if (this.metrics.requestCount === 0) return 0;
    return Math.round((this.metrics.errorCount / this.metrics.requestCount) * 10000) / 100; // Percentage with 2 decimal places
  }

  private logMetrics() {
    const metrics = this.getMetrics();
    
    logger.info('Periodic metrics report', {
      metrics,
      timestamp: new Date().toISOString()
    });

    if (metrics.requests.errorRate > 10) {
      logger.warn('High error rate detected', {
        errorRate: metrics.requests.errorRate,
        totalErrors: metrics.requests.errors,
        totalRequests: metrics.requests.total
      });
    }

    if (metrics.services.healthPercentage < 100) {
      logger.warn('Some services are unhealthy', {
        healthyServices: metrics.services.healthy,
        totalServices: metrics.services.total,
        unhealthyServices: Object.entries(metrics.services.status)
          .filter(([_, isHealthy]) => !isHealthy)
          .map(([serviceName, _]) => serviceName)
      });
    }

    if (metrics.memory.used > 200) {
      logger.warn('High memory usage detected', {
        memoryUsed: metrics.memory.used,
        memoryTotal: metrics.memory.total,
        percentage: Math.round((metrics.memory.used / metrics.memory.total) * 100)
      });
    }
  }

  reset() {
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimeSum: 0,
      responseTimeCount: 0,
      serviceErrors: new Map(),
      statusCodes: new Map()
    };
    
    logger.info('Metrics reset', { timestamp: new Date().toISOString() });
  }
}

export const metricsCollector = new MetricsCollector();
