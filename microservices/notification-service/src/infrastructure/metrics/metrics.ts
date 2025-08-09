import { logger } from '../logging/logger';

export interface RequestMetrics {
  requestCount: number;
  errorCount: number;
  responseTimeSum: number;
  responseTimeCount: number;
  statusCodes: Map<number, number>;
}

export interface NotificationMetrics {
  sent: number;
  failed: number;
  queued: number;
  byTemplate: Map<string, number>;
  byPriority: Map<string, number>;
}

export interface BrokerMetrics {
  published: number;
  consumed: number;
  errors: number;
}

export class MetricsCollector {
  private requests: RequestMetrics;
  private notifications: NotificationMetrics;
  private broker: BrokerMetrics;
  private startTime: number;

  constructor() {
    this.requests = { requestCount: 0, errorCount: 0, responseTimeSum: 0, responseTimeCount: 0, statusCodes: new Map() };
    this.notifications = { sent: 0, failed: 0, queued: 0, byTemplate: new Map(), byPriority: new Map() };
    this.broker = { published: 0, consumed: 0, errors: 0 };
    this.startTime = Date.now();
    setInterval(() => this.report(), 5 * 60 * 1000);
  }

  recordRequest(method: string, path: string, statusCode: number, responseTime: number) {
    this.requests.requestCount++;
    if (statusCode >= 400) this.requests.errorCount++;
    this.requests.responseTimeSum += responseTime;
    this.requests.responseTimeCount++;
    this.requests.statusCodes.set(statusCode, (this.requests.statusCodes.get(statusCode) || 0) + 1);
    logger.debug('Request metrics recorded', { method, path, statusCode, responseTime });
  }

  recordNotification(template: string, priority: string, success: boolean) {
    if (success) this.notifications.sent++; else this.notifications.failed++;
    this.notifications.byTemplate.set(template, (this.notifications.byTemplate.get(template) || 0) + 1);
    this.notifications.byPriority.set(priority, (this.notifications.byPriority.get(priority) || 0) + 1);
  }

  recordQueued(count: number) { this.notifications.queued += count; }

  recordBroker(event: 'published' | 'consumed' | 'error') {
    if (event === 'published') this.broker.published++;
    else if (event === 'consumed') this.broker.consumed++;
    else this.broker.errors++;
  }

  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTime = this.requests.responseTimeCount > 0 ? this.requests.responseTimeSum / this.requests.responseTimeCount : 0;
    return {
      uptime,
      requests: {
        total: this.requests.requestCount,
        errors: this.requests.errorCount,
        errorRate: this.requests.requestCount > 0 ? Math.round((this.requests.errorCount / this.requests.requestCount) * 10000) / 100 : 0,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        statusCodes: Object.fromEntries(this.requests.statusCodes)
      },
      notifications: {
        sent: this.notifications.sent,
        failed: this.notifications.failed,
        queued: this.notifications.queued,
        byTemplate: Object.fromEntries(this.notifications.byTemplate),
        byPriority: Object.fromEntries(this.notifications.byPriority)
      },
      broker: { ...this.broker },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }

  private report() {
    logger.info('Periodic metrics report', { metrics: this.getMetrics() });
  }
}

export const metricsCollector = new MetricsCollector();

