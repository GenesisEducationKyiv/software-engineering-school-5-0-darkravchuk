import * as dotenv from 'dotenv';
dotenv.config();
console.log('process.env in index.ts:', process.env); // Remove after confirming

import express, { Request, Response, NextFunction } from 'express';
import cron from 'node-cron';
import sequelize from './config/database';
import weatherController from './controllers/weatherController';
import subscriptionController from './controllers/subscriptionController';
import SubscriptionService from './services/subscriptionService';
import asyncHandler from './utils/asyncHandler';

const app = express();
const PORT = 3000;

app.use(express.json());

// Weather routes
app.get('/weather/:city', asyncHandler(weatherController.getWeather));

// Subscription routes
app.post('/subscribe', asyncHandler(subscriptionController.subscribe));
app.get('/confirm/:token', asyncHandler(subscriptionController.confirmSubscription));
app.get('/unsubscribe/:token', asyncHandler(subscriptionController.unsubscribe));

// Test route
app.get('/', (req: Request, res: Response) => {
    res.send('Weather and Subscription API is running');
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
    try {
        console.log('WEATHER_API_KEY in index.ts:', process.env.WEATHER_API_KEY);
        await sequelize.sync({ force: false }); // Use migrations instead of sync in production
        console.log('Database connected');

        // Schedule weather updates
        cron.schedule('0 * * * *', () => SubscriptionService.sendWeatherUpdates(), { timezone: 'Europe/Kiev' }); // Hourly
        cron.schedule('0 0 * * *', () => SubscriptionService.sendWeatherUpdates(), { timezone: 'Europe/Kiev' }); // Daily at midnight

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', (error as Error).message);
    }
}

startServer();