import { Router } from 'express';
import { validateWeatherParams } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import { WeatherParams } from '../types/weather/WeatherParams';
import { WeatherResponse } from '../types/weather/WeatherResponse';
import {WeatherController} from '../controllers/weatherController';

const router = Router();

export default (weatherController: WeatherController) => {
  router.get(
    '/:city',
    validateWeatherParams,
    handleError<WeatherParams, WeatherResponse>(
      (req, res) => weatherController.getWeather(req, res)
    )
  );

  router.get(
    '/providers/status',
    handleError<{}, { providers: Array<{ name: string; available: boolean }> }>(
      (req, res) => weatherController.getProviderStatus(req, res)
    )
  );

  return router;
};