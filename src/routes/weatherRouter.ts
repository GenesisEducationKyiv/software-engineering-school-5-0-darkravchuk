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

  // Cache management endpoints
  router.get(
    '/cache/metrics',
    handleError<{}, any>(
      (req, res) => weatherController.getCacheMetrics(req, res)
    )
  );

  router.post(
    '/cache/refresh/:city',
    handleError<{ city: string }, { message: string }>(
      (req, res) => weatherController.refreshCache(req, res)
    )
  );

  router.delete(
    '/cache/clear',
    handleError<{}, { message: string }>(
      (req, res) => weatherController.clearCache(req, res)
    )
  );

  router.get(
    '/metrics/prometheus',
    handleError<{}, string>(
      (req, res) => weatherController.getPrometheusMetrics(req, res)
    )
  );

  router.get(
    '/metrics/report',
    handleError<{}, { metrics: any }>(
      (req, res) => weatherController.getMetricsReport(req, res)
    )
  );

  return router;
};