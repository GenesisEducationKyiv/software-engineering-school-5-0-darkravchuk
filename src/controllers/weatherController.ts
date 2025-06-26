import { Request, Response } from 'express';
import weatherService from '../services/weatherService';
import {WeatherParams, WeatherResponse, ErrorResponse, WeatherData, weatherParamsSchema} from '../types/weather';

class WeatherController {
  async getWeather(req: Request<WeatherParams>, res: Response<WeatherResponse | ErrorResponse>) {
    const { error } = weatherParamsSchema.validate(req.params, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');

      return res.status(400).json({ error: errorMessage });
    }

    const { city } = req.params;

    try {
      const weather: WeatherData = await weatherService.getWeather(city);

      return res.status(200).json({ city, weather });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to get weather data:', errorMessage);

      return res.status(500).json({ error: 'Internal error' });
    }
  }
}

export default new WeatherController();