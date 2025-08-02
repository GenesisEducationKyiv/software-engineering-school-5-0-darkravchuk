import cron from 'node-cron';
import SubscriptionService from '../services/subscriptionService';

export async function scheduleWeatherUpdates(subscriptionService: SubscriptionService): Promise<void> {
  const scheduleJob = (schedule: string, frequency: 'hourly' | 'daily') => {
    cron.schedule(schedule, () => {
      console.log(`Running sendWeatherUpdates for ${frequency} subscriptions at:`, new Date().toISOString());
      subscriptionService.sendWeatherUpdates(frequency).catch(err =>
        console.error(`[ERROR] Cron job failed for ${frequency}:`, err)
      );
    }, { timezone: 'UTC' });
  };

  scheduleJob('0 * * * *', 'hourly');
  scheduleJob('0 0 * * *', 'daily');
}