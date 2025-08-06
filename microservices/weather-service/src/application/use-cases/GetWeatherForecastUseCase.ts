import { WeatherForecast } from '../../domain/entities/WeatherForecast';
import { City } from '../../domain/value-objects/City';
import { Coordinates } from '../../domain/value-objects/Coordinates';
import { IWeatherRepository, IWeatherApiService } from '../../domain/repositories';

export interface GetWeatherForecastRequest {
  city?: string;
  coordinates?: { latitude: number; longitude: number };
  days?: number;
  forceRefresh?: boolean;
}

export interface GetWeatherForecastResponse {
  forecast: WeatherForecast;
  source: 'cache' | 'external';
  cacheAge?: number;
}

export class GetWeatherForecastUseCase {
  private static readonly DEFAULT_FORECAST_DAYS = 5;
  private static readonly MAX_FORECAST_DAYS = 14;

  constructor(
    private readonly weatherRepository: IWeatherRepository,
    private readonly weatherApiService: IWeatherApiService
  ) {}

  async execute(request: GetWeatherForecastRequest): Promise<GetWeatherForecastResponse> {
    this.validateRequest(request);

    const { cityObj, coordinatesObj, days } = this.parseRequest(request);
    
    if (!request.forceRefresh) {
      const cachedForecast = await this.getCachedForecast(cityObj, coordinatesObj, days);
      if (cachedForecast && !cachedForecast.isStale() && !cachedForecast.isExpired()) {
        const cacheAge = Math.floor((Date.now() - cachedForecast.generatedAt.getTime()) / (1000 * 60 * 60));
        return {
          forecast: cachedForecast,
          source: 'cache',
          cacheAge
        };
      }
    }

    const forecast = await this.fetchFromExternalApi(cityObj, coordinatesObj, days);
    
    await this.weatherRepository.saveForecast(forecast);

    return {
      forecast,
      source: 'external'
    };
  }

  private validateRequest(request: GetWeatherForecastRequest): void {
    if (!request.city && !request.coordinates) {
      throw new Error('Either city name or coordinates must be provided');
    }

    if (request.coordinates) {
      const { latitude, longitude } = request.coordinates;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Invalid coordinates format');
      }
    }

    if (request.days !== undefined) {
      if (request.days < 1 || request.days > GetWeatherForecastUseCase.MAX_FORECAST_DAYS) {
        throw new Error(`Forecast days must be between 1 and ${GetWeatherForecastUseCase.MAX_FORECAST_DAYS}`);
      }
    }
  }

  private parseRequest(request: GetWeatherForecastRequest): {
    cityObj?: City;
    coordinatesObj?: Coordinates;
    days: number;
  } {
    let cityObj: City | undefined;
    let coordinatesObj: Coordinates | undefined;

    if (request.city) {
      cityObj = City.fromString(request.city);
    }

    if (request.coordinates) {
      coordinatesObj = new Coordinates(
        request.coordinates.latitude,
        request.coordinates.longitude
      );
    }

    const days = request.days || GetWeatherForecastUseCase.DEFAULT_FORECAST_DAYS;

    return { cityObj, coordinatesObj, days };
  }

  private async getCachedForecast(
    city?: City,
    coordinates?: Coordinates,
    days?: number
  ): Promise<WeatherForecast | null> {
    if (city) {
      return await this.weatherRepository.findForecastByCity(city, days);
    }
    
    if (coordinates) {
      return await this.weatherRepository.findForecastByCoordinates(coordinates, days);
    }

    return null;
  }

  private async fetchFromExternalApi(
    city?: City,
    coordinates?: Coordinates,
    days?: number
  ): Promise<WeatherForecast> {
    try {
      if (city) {
        return await this.weatherApiService.getForecastByCity(city, days);
      }
      
      if (coordinates) {
        return await this.weatherApiService.getForecastByCoordinates(coordinates, days);
      }

      throw new Error('No valid location provided');
    } catch (error) {
      const staleForecast = await this.getCachedForecast(city, coordinates, days);
      if (staleForecast && !staleForecast.isExpired()) {
        return staleForecast;
      }

      throw new Error(`Failed to fetch forecast data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
