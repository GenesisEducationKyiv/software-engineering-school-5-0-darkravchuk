import { Router } from 'express';
import { validateSubscription, validateToken } from '../middleware/validation';
import { handleError } from '../middleware/errorHandler';
import {SubscriptionController} from '../controllers/subscriptionController';
import {SubscriptionRequest} from "../types/subscription/SubscriptionRequest";
import {SuccessResponse} from "../types/subscription/SuccessResponse";
import {TokenRequest} from "../types/subscription/TokenRequest";

const router = Router();

export default (subscriptionController: SubscriptionController) => {
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
  return router;
};