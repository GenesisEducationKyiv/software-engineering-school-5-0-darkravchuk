import cron from 'node-cron';
import SubscriptionService from '../services/subscriptionService';
import { appConfig } from '../config/AppConfig';

export async function scheduleWeatherUpdates(subscriptionService: SubscriptionService): Promise<void> {
  const scheduleJob = (schedule: string, frequency: 'hourly' | 'daily') => {
    try {
      cron.schedule(schedule, () => {
        console.log(`Running sendWeatherUpdates for ${frequency} subscriptions at:`, new Date().toISOString());
        subscriptionService.sendWeatherUpdates(frequency).catch(err =>
          console.error(`[ERROR] Cron job failed for ${frequency}:`, err)
        );
      }, { 
        timezone: appConfig.getTimezone()
      });
    } catch (error) {
      console.error(`[ERROR] Failed to schedule ${frequency} job:`, error);
    }
  };

  scheduleJob('0 * * * *', 'hourly');
  scheduleJob('0 0 * * *', 'daily');
}