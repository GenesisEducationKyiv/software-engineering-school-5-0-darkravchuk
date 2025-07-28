import { Router } from 'express';
import { validateWeatherParams } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import {WeatherController} from '../controllers/weatherController';
import {WeatherParams} from '../types/weather/WeatherParams';
import {WeatherResponse} from '../types/weather/WeatherResponse';

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