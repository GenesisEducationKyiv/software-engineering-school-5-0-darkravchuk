export const WEATHER_TYPES = {
  WeatherRepository: Symbol.for('WeatherRepository'),
  WeatherApiService: Symbol.for('WeatherApiService'),
  
  GetCurrentWeatherUseCase: Symbol.for('GetCurrentWeatherUseCase'),
  GetWeatherForecastUseCase: Symbol.for('GetWeatherForecastUseCase'),
  SearchCitiesUseCase: Symbol.for('SearchCitiesUseCase'),
  
  WeatherConfig: Symbol.for('WeatherConfig')
} as const;
