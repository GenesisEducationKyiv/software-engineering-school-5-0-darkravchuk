import { Request, Response } from 'express';
import {
  GetCurrentWeatherUseCase,
  GetWeatherForecastUseCase,
  SearchCitiesUseCase
} from '../../application/use-cases';

export class WeatherController {
  constructor(
    private readonly getCurrentWeatherUseCase: GetCurrentWeatherUseCase,
    private readonly getWeatherForecastUseCase: GetWeatherForecastUseCase,
    private readonly searchCitiesUseCase: SearchCitiesUseCase
  ) {
    this.getCurrentWeather = this.getCurrentWeather.bind(this);
    this.getWeatherForecast = this.getWeatherForecast.bind(this);
    this.searchCities = this.searchCities.bind(this);
    this.healthCheck = this.healthCheck.bind(this);
  }

  getCurrentWeather = async (req: Request, res: Response): Promise<void> => {
    try {
      const { city, lat, lon, forceRefresh } = req.query;

      if (!city && (!lat || !lon)) {
        res.status(400).json({
          error: 'Either city name or coordinates (lat, lon) must be provided'
        });
        return;
      }

      const coordinates = lat && lon ? {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lon as string)
      } : undefined;

      const result = await this.getCurrentWeatherUseCase.execute({
        city: city as string,
        coordinates,
        forceRefresh: forceRefresh === 'true'
      });

      res.status(200).json({
        success: true,
        data: result.weatherData.toApiResponse(),
        meta: {
          source: result.source,
          cacheAge: result.cacheAge
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get current weather');
    }
  };

  getWeatherForecast = async (req: Request, res: Response): Promise<void> => {
    try {
      const { city, lat, lon, days, forceRefresh } = req.query;

      if (!city && (!lat || !lon)) {
        res.status(400).json({
          error: 'Either city name or coordinates (lat, lon) must be provided'
        });
        return;
      }

      const coordinates = lat && lon ? {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lon as string)
      } : undefined;

      const forecastDays = days ? parseInt(days as string, 10) : undefined;

      const result = await this.getWeatherForecastUseCase.execute({
        city: city as string,
        coordinates,
        days: forecastDays,
        forceRefresh: forceRefresh === 'true'
      });

      res.status(200).json({
        success: true,
        data: result.forecast.toApiResponse(),
        meta: {
          source: result.source,
          cacheAge: result.cacheAge
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to get weather forecast');
    }
  };

  searchCities = async (req: Request, res: Response): Promise<void> => {
    try {
      const { q, limit } = req.query;

      if (!q) {
        res.status(400).json({
          error: 'Query parameter "q" is required'
        });
        return;
      }

      const searchLimit = limit ? parseInt(limit as string, 10) : undefined;

      const result = await this.searchCitiesUseCase.execute({
        query: q as string,
        limit: searchLimit
      });

      res.status(200).json({
        success: true,
        data: {
          cities: result.cities.map(city => ({
            name: city.toString(),
            displayName: city.toString()
          })),
          totalFound: result.totalFound
        }
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to search cities');
    }
  };

  healthCheck = async (req: Request, res: Response): Promise<void> => {
    try {
      res.status(200).json({
        success: true,
        service: 'Weather Service',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    } catch (error) {
      this.handleError(res, error, 'Health check failed');
    }
  };

  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    console.error('Weather Controller Error:', error);

    if (error instanceof Error) {
      // Handle known error types
      if (error.message.includes('Invalid') || error.message.includes('must be')) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.message.includes('not found') || error.message.includes('No city found')) {
        res.status(404).json({
          success: false,
          error: error.message
        });
        return;
      }

      if (error.message.includes('API error') || error.message.includes('Failed to fetch')) {
        res.status(503).json({
          success: false,
          error: 'Weather service temporarily unavailable',
          details: error.message
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: defaultMessage,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
