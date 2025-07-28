import { Request, Response } from 'express';
import {ISubscriptionService} from '../services/SubscriptionService.interface';
import {SubscriptionRequest} from '../types/subscription/SubscriptionRequest';
import {SuccessResponse} from '../types/subscription/SuccessResponse';
import {TokenRequest} from '../types/subscription/TokenRequest';

export class SubscriptionController {
  private subscriptionService: ISubscriptionService;

  constructor(weatherService: ISubscriptionService) {
    this.subscriptionService = weatherService;
  }

  async subscribe(req: Request<{}, {}, SubscriptionRequest>, res: Response) {
    const { email, city, frequency } = req.body;
    const result: SuccessResponse = await this.subscriptionService.subscribe(email, city, frequency);
    res.status(200).json(result);
  }

  async confirmSubscription(req: Request<TokenRequest>, res: Response) {
    const { token } = req.params;
    const result: SuccessResponse = await this.subscriptionService.confirmSubscription(token);
    res.status(200).json(result);
  }

  async unsubscribe(req: Request<TokenRequest>, res: Response) {
    const { token } = req.params;
    const result: SuccessResponse = await this.subscriptionService.unsubscribe(token);
    res.status(200).json(result);
  }
}
