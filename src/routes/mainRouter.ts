import { Router } from 'express';
import weatherRoutes from './weatherRouter';
import subscriptionRoutes from './subscriptionRouter';
import {WeatherController} from '../controllers/weatherController';
import {SubscriptionController} from '../controllers/subscriptionController';

const router = Router();

export default (weatherController: WeatherController,
  subscriptionController: SubscriptionController) => {
  router.use('/weather', weatherRoutes(weatherController));
  router.use('/subscription', subscriptionRoutes(subscriptionController));
  return router;
};