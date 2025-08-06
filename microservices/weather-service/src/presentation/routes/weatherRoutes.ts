import { Router } from 'express';
import { WeatherController } from '../controllers';

export function createWeatherRoutes(weatherController: WeatherController): Router {
  const router = Router();

  router.get('/current', weatherController.getCurrentWeather);
  
  router.get('/forecast', weatherController.getWeatherForecast);
  
  router.get('/cities/search', weatherController.searchCities);
  
  router.get('/health', weatherController.healthCheck);

  return router;
}
