import { Request, Response } from 'express';
import {ISubscriptionService} from '../services/SubscriptionService.interface';
import {ISubscriptionRequest} from '../interfaces/subscription/ISubscriptionRequest';
import {ISuccessResponse} from '../interfaces/subscription/ISuccessResponse';
import {ITokenRequest} from '../interfaces/subscription/ITokenRequest';

export class SubscriptionController {
  private subscriptionService: ISubscriptionService;

  constructor(weatherService: ISubscriptionService) {
    this.subscriptionService = weatherService;
  }

  async subscribe(req: Request<{}, {}, ISubscriptionRequest>, res: Response) {
    const { email, city, frequency } = req.body;
    const result: ISuccessResponse = await this.subscriptionService.subscribe(email, city, frequency);
    res.status(200).json(result);
  }

  async confirmSubscription(req: Request<ITokenRequest>, res: Response) {
    const { token } = req.params;
    const result: ISuccessResponse = await this.subscriptionService.confirmSubscription(token);
    res.status(200).json(result);
  }

  async unsubscribe(req: Request<ITokenRequest>, res: Response) {
    const { token } = req.params;
    const result: ISuccessResponse = await this.subscriptionService.unsubscribe(token);
    res.status(200).json(result);
  }
}
