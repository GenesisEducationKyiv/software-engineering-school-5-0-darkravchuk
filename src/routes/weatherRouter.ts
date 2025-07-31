import { Router } from 'express';
import { validateWeatherParams } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import {WeatherController} from '../controllers/weatherController';
import {IWeatherParams} from '../interfaces/weather/IWeatherParams';
import {IWeatherResponse} from '../interfaces/weather/IWeatherResponse';

const router = Router();

export default (weatherController: WeatherController) => {
  router.get(
    '/:city',
    validateWeatherParams,
    handleError<IWeatherParams, IWeatherResponse>(
      (req, res) => weatherController.getWeather(req, res)
    )
  );
  return router;
};