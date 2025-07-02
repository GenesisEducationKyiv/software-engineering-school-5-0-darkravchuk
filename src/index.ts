import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cron from 'node-cron';
import sequelize from './config/database';
import routes from './routes/mainRouter';
import SequelizeSubscriptionRepository from './repositories/SequelizeSubscriptionRepository';
import path from 'path';

import SubscriptionService from './services/subscriptionService';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', routes);

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/subscribe.html'));
});

const subscriptionRepository = new SequelizeSubscriptionRepository();
const subscriptionService = new SubscriptionService(subscriptionRepository);
export default subscriptionService;


async function scheduleWeatherUpdates() {
  cron.schedule('0 * * * *', () => {
    console.log('Running sendWeatherUpdates for hourly subscriptions at:', new Date().toISOString());
    subscriptionService.sendWeatherUpdates('hourly').catch(err =>
      console.error('[ERROR] Cron job failed for hourly:', err)
    );
  }, { timezone: 'Europe/Kyiv' });

  cron.schedule('0 0 * * *', () => {
    console.log('Running sendWeatherUpdates for daily subscriptions at:', new Date().toISOString());
    subscriptionService.sendWeatherUpdates('daily').catch(err =>
      console.error('[ERROR] Cron job failed for daily:', err)
    );
  }, { timezone: 'Europe/Kyiv' });
}

async function startServer() {
  try {
    await sequelize.sync({ force: false });
    await scheduleWeatherUpdates();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', (error as Error).message);
  }
}

startServer();