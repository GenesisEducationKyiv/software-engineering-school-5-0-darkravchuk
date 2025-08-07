import { WeatherService } from './WeatherService';
import { WeatherConfig } from './infrastructure/container';

const config: WeatherConfig = {
  openWeatherMapApiKey: process.env.OPENWEATHERMAP_API_KEY || 'your-api-key-here',
  cacheEnabled: process.env.CACHE_ENABLED !== 'false',
  cacheTtlMinutes: parseInt(process.env.CACHE_TTL_MINUTES || '30', 10),
  forecastCacheTtlHours: parseInt(process.env.FORECAST_CACHE_TTL_HOURS || '6', 10)
};

if (!config.openWeatherMapApiKey || config.openWeatherMapApiKey === 'your-api-key-here') {
  console.error('OPENWEATHERMAP_API_KEY environment variable is required');
  process.exit(1);
}

const weatherService = new WeatherService(config);
const port = parseInt(process.env.PORT || '3002', 10);

weatherService.start(port);

process.on('SIGTERM', () => {
  console.log('Weather Service shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Weather Service shutting down...');
  process.exit(0);
});
