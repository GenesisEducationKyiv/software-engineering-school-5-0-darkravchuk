import * as cron from 'node-cron';
import { ScheduleService } from '../../application/services/ScheduleService';
import { logger } from '../logging/logger';
import { metricsCollector } from '../metrics/metrics';

export class CronScheduler {
  private runningTasks = new Map<string, cron.ScheduledTask>();

  constructor(private readonly scheduleService: ScheduleService) {}

  start(): void {
    logger.info('Starting Cron Scheduler');
    
    const task = cron.schedule('* * * * *', async () => {
      await this.executeDueSchedules();
    });

    this.runningTasks.set('main-scheduler', task);
    logger.info('Cron Scheduler started successfully');
  }

  stop(): void {
    logger.info('Stopping Cron Scheduler');
    
    this.runningTasks.forEach((task, name) => {
      task.stop();
      logger.debug('Stopped task', { name });
    });
    
    this.runningTasks.clear();
    logger.info('Cron Scheduler stopped');
  }

  private async executeDueSchedules(): Promise<void> {
    try {
      const results = await this.scheduleService.executeAllDueSchedules();
      
      if (results.length > 0) {
        logger.info('Executed scheduled weather updates', { count: results.length });
        results.forEach(result => {
          if (result.status === 'success') {
            metricsCollector.recordScheduleRun(true);
            logger.debug('Schedule executed successfully', { scheduleId: result.scheduleId });
          } else {
            metricsCollector.recordScheduleRun(false);
            logger.warn('Schedule execution failed', { scheduleId: result.scheduleId, error: result.errorMessage });
          }
        });
      }
    } catch (error) {
      logger.error('Error executing scheduled tasks', { error: (error as any)?.message });
    }
  }

  addCustomSchedule(name: string, cronExpression: string, callback: () => Promise<void>): void {
    if (this.runningTasks.has(name)) {
      logger.warn('Task already exists, stopping existing task', { name });
      this.runningTasks.get(name)?.stop();
    }

    const task = cron.schedule(cronExpression, callback);

    this.runningTasks.set(name, task);
    logger.info('Added custom schedule', { name, cron: cronExpression });
  }

  removeCustomSchedule(name: string): void {
    const task = this.runningTasks.get(name);
    if (task) {
      task.stop();
      this.runningTasks.delete(name);
      logger.info('Removed custom schedule', { name });
    }
  }
}
