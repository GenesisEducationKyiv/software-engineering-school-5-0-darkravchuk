import { Request, Response } from 'express';
import weatherService from '../services/weatherService';
import { WeatherParams, WeatherResponse, ErrorResponse, WeatherData } from '../types/weather';

class WeatherController {
    async getWeather(req: Request<WeatherParams>, res: Response<WeatherResponse | ErrorResponse>) {
        const { city } = req.params;

        if (!city) {
            return res.status(400).json({ error: 'City parameter is required' });
        }

        try {
            const weather: WeatherData = await weatherService.getWeather(city);
            return res.status(200).json({ city, weather });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            return res.status(500).json({ error: `Failed to fetch weather: ${errorMessage}` });
        }
    }
}

export default new WeatherController();