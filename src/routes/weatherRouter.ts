import { Router } from 'express';
import { validateWeatherParams } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import { WeatherParams, WeatherResponse } from '../types/weather';
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
  return router;
};