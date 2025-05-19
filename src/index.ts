import * as dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cron from 'node-cron';
import sequelize from './config/database';
import weatherController from './controllers/weatherController';
import subscriptionController from './controllers/subscriptionController';
import SubscriptionService from './services/subscriptionService';
import asyncHandler from './utils/asyncHandler';
import path from "node:path";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/weather/:city', asyncHandler(weatherController.getWeather));

app.post('/subscribe', asyncHandler(subscriptionController.subscribe));
app.get('/confirm/:token', asyncHandler(subscriptionController.confirmSubscription));
app.get('/unsubscribe/:token', asyncHandler(subscriptionController.unsubscribe));

app.get('/', (req: Request, res: Response) => {
    res.send('Weather and Subscription API is running');
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

async function startServer() {
    try {
        await sequelize.sync({ force: false });

        cron.schedule('*/1 * * * *', () => {
            console.log('Running sendWeatherUpdates for hourly subscriptions at:', new Date().toISOString());
            SubscriptionService.sendWeatherUpdates('hourly').catch(err => {
                console.error('[ERROR] Cron job failed for hourly:', err);
            });
        }, { timezone: 'Europe/Kyiv' });

        cron.schedule('0 0 * * *', () => {
            console.log('Running sendWeatherUpdates for daily subscriptions at:', new Date().toISOString());
            SubscriptionService.sendWeatherUpdates('daily').catch(err => {
                console.error('[ERROR] Cron job failed for daily:', err);
            });
        }, { timezone: 'Europe/Kyiv' });

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', (error as Error).message);
    }
}

startServer();