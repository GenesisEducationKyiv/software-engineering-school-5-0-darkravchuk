import { logger } from '../logging/logger';

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  pendingConfirmations: number;
  totalUnsubscribes: number;
  subscriptionsByCity: Map<string, number>;
  subscriptionsByFrequency: Map<string, number>;
}

export interface RequestMetrics {
  requestCount: number;
  errorCount: number;
  responseTimeSum: number;
  responseTimeCount: number;
  endpointMetrics: Map<string, {
    count: number;
    errors: number;
    totalResponseTime: number;
  }>;
  statusCodes: Map<number, number>;
}

export interface ExternalServiceMetrics {
  emailServiceCalls: number;
  emailServiceErrors: number;
  weatherServiceCalls: number;
  weatherServiceErrors: number;
  eventPublisherCalls: number;
  eventPublisherErrors: number;
}

export class MetricsCollector {
  private subscriptionMetrics: SubscriptionMetrics;
  private requestMetrics: RequestMetrics;
  private externalServiceMetrics: ExternalServiceMetrics;
  private startTime: number;

  constructor() {
    this.subscriptionMetrics = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      pendingConfirmations: 0,
      totalUnsubscribes: 0,
      subscriptionsByCity: new Map(),
      subscriptionsByFrequency: new Map()
    };

    this.requestMetrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimeSum: 0,
      responseTimeCount: 0,
      endpointMetrics: new Map(),
      statusCodes: new Map()
    };

    this.externalServiceMetrics = {
      emailServiceCalls: 0,
      emailServiceErrors: 0,
      weatherServiceCalls: 0,
      weatherServiceErrors: 0,
      eventPublisherCalls: 0,
      eventPublisherErrors: 0
    };

    this.startTime = Date.now();

    setInterval(() => {
      this.logMetrics();
    }, 10 * 60 * 1000);
  }

  recordSubscriptionCreated(city: string, frequency: string) {
    this.subscriptionMetrics.totalSubscriptions++;
    this.subscriptionMetrics.pendingConfirmations++;
    
    const cityCount = this.subscriptionMetrics.subscriptionsByCity.get(city) || 0;
    this.subscriptionMetrics.subscriptionsByCity.set(city, cityCount + 1);
    
    const frequencyCount = this.subscriptionMetrics.subscriptionsByFrequency.get(frequency) || 0;
    this.subscriptionMetrics.subscriptionsByFrequency.set(frequency, frequencyCount + 1);

    logger.debug('Subscription created metric recorded', {
      city,
      frequency,
      totalSubscriptions: this.subscriptionMetrics.totalSubscriptions,
      pendingConfirmations: this.subscriptionMetrics.pendingConfirmations
    });
  }

  recordSubscriptionConfirmed() {
    this.subscriptionMetrics.activeSubscriptions++;
    this.subscriptionMetrics.pendingConfirmations = Math.max(0, this.subscriptionMetrics.pendingConfirmations - 1);

    logger.debug('Subscription confirmed metric recorded', {
      activeSubscriptions: this.subscriptionMetrics.activeSubscriptions,
      pendingConfirmations: this.subscriptionMetrics.pendingConfirmations
    });
  }

  recordUnsubscribe() {
    this.subscriptionMetrics.totalUnsubscribes++;
    this.subscriptionMetrics.activeSubscriptions = Math.max(0, this.subscriptionMetrics.activeSubscriptions - 1);

    logger.debug('Unsubscribe metric recorded', {
      totalUnsubscribes: this.subscriptionMetrics.totalUnsubscribes,
      activeSubscriptions: this.subscriptionMetrics.activeSubscriptions
    });
  }

  recordRequest(method: string, path: string, statusCode: number, responseTime: number) {
    this.requestMetrics.requestCount++;
    
    const currentCount = this.requestMetrics.statusCodes.get(statusCode) || 0;
    this.requestMetrics.statusCodes.set(statusCode, currentCount + 1);
    
    this.requestMetrics.responseTimeSum += responseTime;
    this.requestMetrics.responseTimeCount++;
    
    if (statusCode >= 400) {
      this.requestMetrics.errorCount++;
    }

    const endpoint = `${method} ${path}`;
    const endpointData = this.requestMetrics.endpointMetrics.get(endpoint) || {
      count: 0,
      errors: 0,
      totalResponseTime: 0
    };
    
    endpointData.count++;
    endpointData.totalResponseTime += responseTime;
    if (statusCode >= 400) {
      endpointData.errors++;
    }
    
    this.requestMetrics.endpointMetrics.set(endpoint, endpointData);

    logger.debug('Request metrics recorded', {
      method,
      path,
      statusCode,
      responseTime,
      totalRequests: this.requestMetrics.requestCount,
      errorRate: this.getErrorRate()
    });
  }

  recordExternalServiceCall(serviceName: 'email' | 'weather' | 'eventPublisher', success: boolean) {
    switch (serviceName) {
    case 'email':
      this.externalServiceMetrics.emailServiceCalls++;
      if (!success) this.externalServiceMetrics.emailServiceErrors++;
      break;
    case 'weather':
      this.externalServiceMetrics.weatherServiceCalls++;
      if (!success) this.externalServiceMetrics.weatherServiceErrors++;
      break;
    case 'eventPublisher':
      this.externalServiceMetrics.eventPublisherCalls++;
      if (!success) this.externalServiceMetrics.eventPublisherErrors++;
      break;
    }

    logger.debug('External service call recorded', {
      serviceName,
      success,
      totalCalls: this.getTotalExternalCalls(),
      totalErrors: this.getTotalExternalErrors()
    });
  }

  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTime = this.requestMetrics.responseTimeCount > 0 
      ? this.requestMetrics.responseTimeSum / this.requestMetrics.responseTimeCount 
      : 0;

    return {
      uptime,
      subscriptions: {
        total: this.subscriptionMetrics.totalSubscriptions,
        active: this.subscriptionMetrics.activeSubscriptions,
        pending: this.subscriptionMetrics.pendingConfirmations,
        unsubscribes: this.subscriptionMetrics.totalUnsubscribes,
        confirmationRate: this.getConfirmationRate(),
        byCity: Object.fromEntries(this.subscriptionMetrics.subscriptionsByCity),
        byFrequency: Object.fromEntries(this.subscriptionMetrics.subscriptionsByFrequency)
      },
      requests: {
        total: this.requestMetrics.requestCount,
        errors: this.requestMetrics.errorCount,
        errorRate: this.getErrorRate(),
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        endpoints: this.getEndpointMetrics()
      },
      externalServices: {
        email: {
          calls: this.externalServiceMetrics.emailServiceCalls,
          errors: this.externalServiceMetrics.emailServiceErrors,
          errorRate: this.getExternalServiceErrorRate('email')
        },
        weather: {
          calls: this.externalServiceMetrics.weatherServiceCalls,
          errors: this.externalServiceMetrics.weatherServiceErrors,
          errorRate: this.getExternalServiceErrorRate('weather')
        },
        eventPublisher: {
          calls: this.externalServiceMetrics.eventPublisherCalls,
          errors: this.externalServiceMetrics.eventPublisherErrors,
          errorRate: this.getExternalServiceErrorRate('eventPublisher')
        }
      },
      statusCodes: Object.fromEntries(this.requestMetrics.statusCodes),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }

  private getErrorRate(): number {
    if (this.requestMetrics.requestCount === 0) return 0;
    return Math.round((this.requestMetrics.errorCount / this.requestMetrics.requestCount) * 10000) / 100;
  }

  private getConfirmationRate(): number {
    const totalProcessed = this.subscriptionMetrics.activeSubscriptions + this.subscriptionMetrics.totalUnsubscribes;
    if (this.subscriptionMetrics.totalSubscriptions === 0) return 0;
    return Math.round((this.subscriptionMetrics.activeSubscriptions / this.subscriptionMetrics.totalSubscriptions) * 10000) / 100;
  }

  private getExternalServiceErrorRate(service: 'email' | 'weather' | 'eventPublisher'): number {
    let calls = 0;
    let errors = 0;
    
    switch (service) {
    case 'email':
      calls = this.externalServiceMetrics.emailServiceCalls;
      errors = this.externalServiceMetrics.emailServiceErrors;
      break;
    case 'weather':
      calls = this.externalServiceMetrics.weatherServiceCalls;
      errors = this.externalServiceMetrics.weatherServiceErrors;
      break;
    case 'eventPublisher':
      calls = this.externalServiceMetrics.eventPublisherCalls;
      errors = this.externalServiceMetrics.eventPublisherErrors;
      break;
    }
    
    if (calls === 0) return 0;
    return Math.round((errors / calls) * 10000) / 100;
  }

  private getTotalExternalCalls(): number {
    return this.externalServiceMetrics.emailServiceCalls + 
           this.externalServiceMetrics.weatherServiceCalls + 
           this.externalServiceMetrics.eventPublisherCalls;
  }

  private getTotalExternalErrors(): number {
    return this.externalServiceMetrics.emailServiceErrors + 
           this.externalServiceMetrics.weatherServiceErrors + 
           this.externalServiceMetrics.eventPublisherErrors;
  }

  private getEndpointMetrics() {
    const endpointMetrics: any = {};
    this.requestMetrics.endpointMetrics.forEach((data, endpoint) => {
      endpointMetrics[endpoint] = {
        count: data.count,
        errors: data.errors,
        errorRate: data.count > 0 ? Math.round((data.errors / data.count) * 10000) / 100 : 0,
        avgResponseTime: data.count > 0 ? Math.round((data.totalResponseTime / data.count) * 100) / 100 : 0
      };
    });
    return endpointMetrics;
  }

  private logMetrics() {
    const metrics = this.getMetrics();
    
    logger.info('Periodic metrics report', {
      metrics,
      timestamp: new Date().toISOString()
    });

    if (metrics.requests.errorRate > 5) {
      logger.warn('High error rate detected', {
        errorRate: metrics.requests.errorRate,
        totalErrors: metrics.requests.errors,
        totalRequests: metrics.requests.total
      });
    }

    if (metrics.subscriptions.confirmationRate < 50 && metrics.subscriptions.total > 10) {
      logger.warn('Low confirmation rate detected', {
        confirmationRate: metrics.subscriptions.confirmationRate,
        totalSubscriptions: metrics.subscriptions.total,
        activeSubscriptions: metrics.subscriptions.active
      });
    }

    Object.entries(metrics.externalServices).forEach(([serviceName, serviceMetrics]) => {
      if (serviceMetrics.errorRate > 10 && serviceMetrics.calls > 5) {
        logger.warn(`High error rate for external service: ${serviceName}`, {
          serviceName,
          errorRate: serviceMetrics.errorRate,
          errors: serviceMetrics.errors,
          calls: serviceMetrics.calls
        });
      }
    });

    if (metrics.memory.used > 200) { // More than 200MB
      logger.warn('High memory usage detected', {
        memoryUsed: metrics.memory.used,
        memoryTotal: metrics.memory.total,
        percentage: Math.round((metrics.memory.used / metrics.memory.total) * 100)
      });
    }
  }

  reset() {
    this.subscriptionMetrics = {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
      pendingConfirmations: 0,
      totalUnsubscribes: 0,
      subscriptionsByCity: new Map(),
      subscriptionsByFrequency: new Map()
    };
    
    this.requestMetrics = {
      requestCount: 0,
      errorCount: 0,
      responseTimeSum: 0,
      responseTimeCount: 0,
      endpointMetrics: new Map(),
      statusCodes: new Map()
    };

    this.externalServiceMetrics = {
      emailServiceCalls: 0,
      emailServiceErrors: 0,
      weatherServiceCalls: 0,
      weatherServiceErrors: 0,
      eventPublisherCalls: 0,
      eventPublisherErrors: 0
    };
    
    logger.info('Metrics reset', { timestamp: new Date().toISOString() });
  }
}

export const metricsCollector = new MetricsCollector();
