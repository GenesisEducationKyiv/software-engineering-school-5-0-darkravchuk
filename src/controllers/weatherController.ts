import { Request, Response } from 'express';
import {IWeatherService} from '../services/WeatherService.interface';
import {BadRequestError} from '../errors/httpError';
import {WeatherParams} from '../types/weather/WeatherParams';

export class WeatherController {
  private weatherService: IWeatherService;

  constructor(weatherService: IWeatherService) {
    this.weatherService = weatherService;
  }

  async getWeather(req: Request<WeatherParams>, res: Response) {
    const { city } = req.params;

    if (!city) {
      throw new BadRequestError('City parameter is required');
    }
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
