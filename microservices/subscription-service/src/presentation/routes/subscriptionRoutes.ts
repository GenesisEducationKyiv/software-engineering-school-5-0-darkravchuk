import { Router } from 'express';
import { container } from '../../infrastructure/di/container';
import { SubscriptionController } from '../controllers/SubscriptionController';
import { TYPES } from '../../infrastructure/di/types';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    service: 'subscription-routes',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});


const subscriptionController = container.get<SubscriptionController>(TYPES.SubscriptionController);

router.post('/', async (req, res, next) => {
  await subscriptionController.createSubscription(req, res, next);
});

router.get('/active', async (req, res, next) => {
  await subscriptionController.getActiveSubscriptions(req, res, next);
});

router.post('/confirm/:token', async (req, res, next) => {
  await subscriptionController.confirmSubscription(req, res, next);
});

router.delete('/unsubscribe/:token', async (req, res, next) => {
  await subscriptionController.unsubscribe(req, res, next);
});


export { router as subscriptionRoutes };
