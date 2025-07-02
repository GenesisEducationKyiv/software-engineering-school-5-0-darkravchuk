import { Router } from 'express';
import subscriptionController from '../controllers/subscriptionController';
import { validateSubscription, validateToken } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import { SubscriptionRequest, TokenRequest, SuccessResponse } from '../types/subscription';

const router = Router();

router.post(
  '/subscribe',
  validateSubscription,
  handleError<{}, SuccessResponse, SubscriptionRequest>(
    (req, res) => subscriptionController.subscribe(req, res)
  )
);

router.get(
  '/confirm/:token',
  validateToken,
  handleError<TokenRequest, SuccessResponse>(
    (req, res) => subscriptionController.confirmSubscription(req, res)
  )
);

router.get(
  '/unsubscribe/:token',
  validateToken,
  handleError<TokenRequest, SuccessResponse>(
    (req, res) => subscriptionController.unsubscribe(req, res)
  )
);

export default router;