import { Request, Response } from 'express';
import { WeatherParams } from '../types/weather';
import {IWeatherService} from '../services/WeatherService.interface';

export class WeatherController {
  private weatherService: IWeatherService;

  constructor(weatherService: IWeatherService) {
    this.weatherService = weatherService;
  }

  async getWeather(req: Request<WeatherParams>, res: Response) {
    const { city } = req.params;

    const weatherData = await this.weatherService.getWeather(city);
    res.status(200).json({
      city,
      temperature: weatherData.temperature,
      description: weatherData.description,
      humidity: weatherData.humidity,
      pressure: weatherData.pressure
    });
  }
}
