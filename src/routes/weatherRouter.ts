import { Router } from 'express';
import weatherController from '../controllers/weatherController';
import { validateWeatherParams } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import { WeatherParams, WeatherResponse } from '../types/weather';

const router = Router();

router.get(
    '/weather/:city',
    validateWeatherParams,
    handleError<WeatherParams, WeatherResponse>(
        (req, res) => weatherController.getWeather(req, res)
    )
);

export default router;