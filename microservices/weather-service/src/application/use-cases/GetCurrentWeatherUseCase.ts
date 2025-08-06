import { WeatherData } from '../../domain/entities/WeatherData';
import { City } from '../../domain/value-objects/City';
import { Coordinates } from '../../domain/value-objects/Coordinates';
import { IWeatherRepository, IWeatherApiService } from '../../domain/repositories';

export interface GetCurrentWeatherRequest {
  city?: string;
  coordinates?: { latitude: number; longitude: number };
  forceRefresh?: boolean;
}

export interface GetCurrentWeatherResponse {
  weatherData: WeatherData;
  source: 'cache' | 'external';
  cacheAge?: number;
}

export class GetCurrentWeatherUseCase {
  constructor(
    private readonly weatherRepository: IWeatherRepository,
    private readonly weatherApiService: IWeatherApiService
  ) {}

  async execute(request: GetCurrentWeatherRequest): Promise<GetCurrentWeatherResponse> {
    this.validateRequest(request);

    const { cityObj, coordinatesObj } = this.parseRequest(request);
    
    if (!request.forceRefresh) {
      const cachedWeather = await this.getCachedWeather(cityObj, coordinatesObj);
      if (cachedWeather && !cachedWeather.isStale()) {
        const cacheAge = Math.floor((Date.now() - cachedWeather.timestamp.getTime()) / (1000 * 60));
        return {
          weatherData: cachedWeather,
          source: 'cache',
          cacheAge
        };
      }
    }

    const weatherData = await this.fetchFromExternalApi(cityObj, coordinatesObj);
    
    await this.weatherRepository.saveCurrentWeather(weatherData);

    return {
      weatherData,
      source: 'external'
    };
  }

  private validateRequest(request: GetCurrentWeatherRequest): void {
    if (!request.city && !request.coordinates) {
      throw new Error('Either city name or coordinates must be provided');
    }

    if (request.coordinates) {
      const { latitude, longitude } = request.coordinates;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Invalid coordinates format');
      }
    }
  }

  private parseRequest(request: GetCurrentWeatherRequest): {
    cityObj?: City;
    coordinatesObj?: Coordinates;
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

    return { cityObj, coordinatesObj };
  }

  private async getCachedWeather(
    city?: City,
    coordinates?: Coordinates
  ): Promise<WeatherData | null> {
    if (city) {
      return await this.weatherRepository.findCurrentWeatherByCity(city);
    }
    
    if (coordinates) {
      return await this.weatherRepository.findCurrentWeatherByCoordinates(coordinates);
    }

    return null;
  }

  private async fetchFromExternalApi(
    city?: City,
    coordinates?: Coordinates
  ): Promise<WeatherData> {
    try {
      if (city) {
        return await this.weatherApiService.getCurrentWeatherByCity(city);
      }
      
      if (coordinates) {
        return await this.weatherApiService.getCurrentWeatherByCoordinates(coordinates);
      }

      throw new Error('No valid location provided');
    } catch (error) {
      const staleWeather = await this.getCachedWeather(city, coordinates);
      if (staleWeather) {
        return staleWeather;
      }

      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
