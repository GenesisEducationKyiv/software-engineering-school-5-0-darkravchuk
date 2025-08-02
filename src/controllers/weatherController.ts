import { Request, Response } from 'express';
import {IWeatherService} from '../services/WeatherService.interface';
import {BadRequestError} from '../errors/httpError';
import {IWeatherParams} from '../interfaces/weather/IWeatherParams';

export class WeatherController {
  private weatherService: IWeatherService;

  constructor(weatherService: IWeatherService) {
    this.weatherService = weatherService;
  }

  async getWeather(req: Request<IWeatherParams>, res: Response) {
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

  async getProviderStatus(req: Request, res: Response) {
    try {
      // Access the provider chain to get status
      const providerChain = (this.weatherService as any).weatherProvider;
      if (providerChain && typeof providerChain.getProviderStatus === 'function') {
        const status = providerChain.getProviderStatus();
        res.status(200).json({ providers: status });
      } else {
        res.status(200).json({
          providers: [{
            name: 'weather-provider',
            available: true
          }]
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get provider status' });
    }
  }
}
