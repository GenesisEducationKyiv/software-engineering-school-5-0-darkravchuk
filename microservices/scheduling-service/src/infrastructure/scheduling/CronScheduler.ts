import * as cron from 'node-cron';
import { ScheduleService } from '../../application/services/ScheduleService';

export class CronScheduler {
  private runningTasks = new Map<string, cron.ScheduledTask>();

  constructor(private readonly scheduleService: ScheduleService) {}

  start(): void {
    console.log('Starting Cron Scheduler...');
    
    const task = cron.schedule('* * * * *', async () => {
      await this.executeDueSchedules();
    });

    this.runningTasks.set('main-scheduler', task);
    console.log('Cron Scheduler started successfully');
  }

  stop(): void {
    console.log('Stopping Cron Scheduler...');
    
    this.runningTasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });
    
    this.runningTasks.clear();
    console.log('Cron Scheduler stopped');
  }

  private async executeDueSchedules(): Promise<void> {
    try {
      const results = await this.scheduleService.executeAllDueSchedules();
      
      if (results.length > 0) {
        console.log(`Executed ${results.length} scheduled weather updates:`);
        results.forEach(result => {
          if (result.status === 'success') {
            console.log(`✅ Schedule ${result.scheduleId} executed successfully`);
          } else {
            console.log(`❌ Schedule ${result.scheduleId} failed: ${result.errorMessage}`);
          }
        });
      }
    } catch (error) {
      console.error('Error executing scheduled tasks:', error);
    }
  }

  addCustomSchedule(name: string, cronExpression: string, callback: () => Promise<void>): void {
    if (this.runningTasks.has(name)) {
      console.warn(`Task ${name} already exists. Stopping existing task.`);
      this.runningTasks.get(name)?.stop();
    }

    const task = cron.schedule(cronExpression, callback);

    this.runningTasks.set(name, task);
    console.log(`Added custom schedule: ${name} with cron: ${cronExpression}`);
  }

  removeCustomSchedule(name: string): void {
    const task = this.runningTasks.get(name);
    if (task) {
      task.stop();
      this.runningTasks.delete(name);
      console.log(`Removed custom schedule: ${name}`);
    }
  }
}
