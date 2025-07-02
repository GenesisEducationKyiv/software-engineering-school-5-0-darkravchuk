import { Request, Response } from 'express';
import weatherService from '../services/weatherService';
import { WeatherParams } from '../types/weather';

class WeatherController {
  async getWeather(req: Request<WeatherParams>, res: Response) {
    const { city } = req.params;

    const weatherData = await weatherService.getWeather(city);
    res.status(200).json({
      city,
      temperature: weatherData.temperature,
      description: weatherData.description,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure
    });
  }
}

export default new WeatherController();