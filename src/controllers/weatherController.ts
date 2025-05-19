import { Request, Response } from 'express';
import weatherService from '../services/weatherService';

class WeatherController {
    async getWeather(req: Request, res: Response) {
        const { city } = req.params;

        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        try {
            const weather = await weatherService.getWeather(city);
            res.status(200).json({ city, weather });
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch weather: ' + (error as Error).message });
        }
    }
}

export default new WeatherController();