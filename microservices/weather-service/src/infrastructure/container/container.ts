import { IWeatherRepository, IWeatherApiService } from '../../domain/repositories';

import {
  GetCurrentWeatherUseCase,
  GetWeatherForecastUseCase,
  SearchCitiesUseCase
} from '../../application/use-cases';

import {
  OpenWeatherMapService,
  InMemoryWeatherRepository
} from '../repositories';

export interface WeatherContainer {
  weatherRepository: IWeatherRepository;
  weatherApiService: IWeatherApiService;
  getCurrentWeatherUseCase: GetCurrentWeatherUseCase;
  getWeatherForecastUseCase: GetWeatherForecastUseCase;
  searchCitiesUseCase: SearchCitiesUseCase;
}

export interface WeatherConfig {
  openWeatherMapApiKey: string;
  cacheEnabled: boolean;
  cacheTtlMinutes: number;
  forecastCacheTtlHours: number;
}

export function createWeatherContainer(config: WeatherConfig): WeatherContainer {
  const weatherRepository: IWeatherRepository = new InMemoryWeatherRepository();
  const weatherApiService: IWeatherApiService = new OpenWeatherMapService(config.openWeatherMapApiKey);

  const getCurrentWeatherUseCase = new GetCurrentWeatherUseCase(weatherRepository, weatherApiService);
  const getWeatherForecastUseCase = new GetWeatherForecastUseCase(weatherRepository, weatherApiService);
  const searchCitiesUseCase = new SearchCitiesUseCase(weatherApiService);

  return {
    weatherRepository,
    weatherApiService,
    getCurrentWeatherUseCase,
    getWeatherForecastUseCase,
    searchCitiesUseCase
  };
}
