import { Router } from 'express';
import { validateSubscription, validateToken } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import {SubscriptionController} from '../controllers/subscriptionController';
import {ISubscriptionRequest} from '../interfaces/subscription/ISubscriptionRequest';
import {ISuccessResponse} from '../interfaces/subscription/ISuccessResponse';
import {ITokenRequest} from '../interfaces/subscription/ITokenRequest';

const router = Router();

export default (subscriptionController: SubscriptionController) => {
  router.post(
    '/subscribe',
    validateSubscription,
    handleError<{}, ISuccessResponse, ISubscriptionRequest>(
      (req, res) => subscriptionController.subscribe(req, res)
    )
  );

  router.get(
    '/confirm/:token',
    validateToken,
    handleError<ITokenRequest, ISuccessResponse>(
      (req, res) => subscriptionController.confirmSubscription(req, res)
    )
  );

  router.get(
    '/unsubscribe/:token',
    validateToken,
    handleError<ITokenRequest, ISuccessResponse>(
      (req, res) => subscriptionController.unsubscribe(req, res)
    )
  );
  return router;
};