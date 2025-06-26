import { Request, Response } from 'express';
import {
  subscriptionSchema,
  SubscriptionRequest,
  TokenRequest,
  SuccessResponse,
  ErrorResponse,
  tokenSchema
} from '../types/subscription';
import subscriptionService from '../services/subscriptionService';

class SubscriptionController {
  async subscribe(req: Request<{}, {}, SubscriptionRequest>, res: Response<SuccessResponse | ErrorResponse>) {

    const { error } = subscriptionSchema.validate(req.body, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');

      return res.status(400).json({ error: errorMessage });
    }

    const { email, city, frequency } = req.body;

    try {
      const result: SuccessResponse = await subscriptionService.subscribe(email, city, frequency);

      return res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'Email already subscribed') {

        return res.status(409).json({ error: errorMessage });
      }
      console.error('Failed to subscribe', errorMessage);

      return res.status(500).json({ error: 'Internal error' });
    }
  }

  async confirmSubscription(req: Request<TokenRequest>, res: Response<SuccessResponse | ErrorResponse>) {

    const { error } = tokenSchema.validate(req.params, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');

      return res.status(400).json({ error: errorMessage });
    }
    const { token } = req.params;

    try {
      const result: SuccessResponse = await subscriptionService.confirmSubscription(token);

      return res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'Token not found' || errorMessage === 'Already confirmed') {

        return res.status(404).json({ error: errorMessage });
      }
      console.error('Failed to confirm subscription:', errorMessage);

      return res.status(500).json({ error: 'Internal error' });
    }
  }

  async unsubscribe(req: Request<TokenRequest>, res: Response<SuccessResponse | ErrorResponse>) {
    const { error } = tokenSchema.validate(req.params, { abortEarly: false });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');

      return res.status(400).json({ error: errorMessage });
    }

    const { token } = req.params;

    try {
      const result: SuccessResponse = await subscriptionService.unsubscribe(token);

      return res.status(200).json(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'Token not found') {

        return res.status(404).json({ error: errorMessage });
      }
      console.error('Failed to unsubscribe:', errorMessage);

      return res.status(500).json({ error: 'Internal error' });
    }
  }
}

export default new SubscriptionController();