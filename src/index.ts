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
import {ErrorResponse, SubscriptionRequest, SuccessResponse, TokenRequest} from "./types/subscription";

const app = express();
const PORT = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/weather/:city', async (req: Request<{ city: string }>, res: Response) => {
    try {
        await weatherController.getWeather(req, res);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: `Failed to fetch weather: ${errorMessage}` });
    }
});

app.post('/subscribe', async (req: Request<{}, {}, SubscriptionRequest>, res: Response<SuccessResponse | ErrorResponse>) => {
    try {
        await subscriptionController.subscribe(req, res);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: `Failed to subscribe: ${errorMessage}` });
    }
});

app.get('/confirm/:token', async (req: Request<TokenRequest>, res: Response<SuccessResponse | ErrorResponse>) => {
    try {
        await subscriptionController.confirmSubscription(req, res);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: `Failed to confirm subscription: ${errorMessage}` });
    }
});

app.get('/unsubscribe/:token', async (req: Request<TokenRequest>, res: Response<SuccessResponse | ErrorResponse>) => {
    try {
        await subscriptionController.unsubscribe(req, res);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: `Failed to unsubscribe: ${errorMessage}` });
    }
});

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/subscribe.html'));
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