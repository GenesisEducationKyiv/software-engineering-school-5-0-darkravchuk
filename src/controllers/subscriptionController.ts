import { Request, Response } from 'express';
import { SubscriptionRequest, TokenRequest, SuccessResponse } from '../types/subscription';
import subscriptionService from '../index';

class SubscriptionController {
  async subscribe(req: Request<{}, {}, SubscriptionRequest>, res: Response) {
    const { email, city, frequency } = req.body;
    const result: SuccessResponse = await subscriptionService.subscribe(email, city, frequency);
    res.status(200).json(result);
  }

  async confirmSubscription(req: Request<TokenRequest>, res: Response) {
    const { token } = req.params;
    const result: SuccessResponse = await subscriptionService.confirmSubscription(token);
    res.status(200).json(result);
  }

  async unsubscribe(req: Request<TokenRequest>, res: Response) {
    const { token } = req.params;
    const result: SuccessResponse = await subscriptionService.unsubscribe(token);
    res.status(200).json(result);
  }
}

export default new SubscriptionController();