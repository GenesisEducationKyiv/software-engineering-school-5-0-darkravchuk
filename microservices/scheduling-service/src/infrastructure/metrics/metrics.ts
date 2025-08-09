import { logger } from '../logging/logger';

export class MetricsCollector {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimeSum = 0;
  private responseTimeCount = 0;
  private statusCodes = new Map<number, number>();
  private schedulesTriggered = 0;
  private schedulesSucceeded = 0;
  private schedulesFailed = 0;

  recordRequest(statusCode: number, responseTime: number) {
    this.requestCount++;
    if (statusCode >= 400) this.errorCount++;
    this.responseTimeSum += responseTime;
    this.responseTimeCount++;
    this.statusCodes.set(statusCode, (this.statusCodes.get(statusCode) || 0) + 1);
  }

  recordScheduleRun(success: boolean) {
    this.schedulesTriggered++;
    if (success) this.schedulesSucceeded++; else this.schedulesFailed++;
  }

  getMetrics() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTime = this.responseTimeCount > 0 ? this.responseTimeSum / this.responseTimeCount : 0;
    return {
      uptime,
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0 ? Math.round((this.errorCount / this.requestCount) * 10000) / 100 : 0,
        averageResponseTime: Math.round(avgResponseTime * 100) / 100,
        statusCodes: Object.fromEntries(this.statusCodes)
      },
      scheduler: {
        triggered: this.schedulesTriggered,
        succeeded: this.schedulesSucceeded,
        failed: this.schedulesFailed,
        successRate: this.schedulesTriggered > 0 ? Math.round((this.schedulesSucceeded / this.schedulesTriggered) * 10000) / 100 : 0
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    };
  }

  report() { logger.info('Periodic metrics report', { metrics: this.getMetrics() }); }
}

export const metricsCollector = new MetricsCollector();

