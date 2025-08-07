import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'inversify';
import { CreateSubscriptionUseCase } from '../../application/use-cases/CreateSubscriptionUseCase';
import { ConfirmSubscriptionUseCase } from '../../application/use-cases/ConfirmSubscriptionUseCase';
import { UnsubscribeUseCase } from '../../application/use-cases/UnsubscribeUseCase';
import { GetActiveSubscriptionsUseCase } from '../../application/use-cases/GetActiveSubscriptionsUseCase';
import { 
  CreateSubscriptionRequest,
  ConfirmSubscriptionRequest,
  UnsubscribeRequest 
} from '../../application/dto/SubscriptionDto';
import { 
  ValidationError,
} from '../../application/errors/ApplicationErrors';
import { TYPES } from '../../infrastructure/di/types';

@injectable()
export class SubscriptionController {
  constructor(
    @inject(TYPES.CreateSubscriptionUseCase) private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    @inject(TYPES.ConfirmSubscriptionUseCase) private readonly confirmSubscriptionUseCase: ConfirmSubscriptionUseCase,
    @inject(TYPES.UnsubscribeUseCase) private readonly unsubscribeUseCase: UnsubscribeUseCase,
    @inject(TYPES.GetActiveSubscriptionsUseCase) private readonly getActiveSubscriptionsUseCase: GetActiveSubscriptionsUseCase
  ) {}

  async createSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      console.log(req.body);
      const request: CreateSubscriptionRequest = {
        email: req.body.email,
        city: req.body.city,
        frequency: req.body.frequency
      };

      this.validateCreateSubscriptionRequest(request);

      console.log('After validation');
      const result = await this.createSubscriptionUseCase.execute(request);

      console.log('After request');
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async confirmSubscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: ConfirmSubscriptionRequest = {
        confirmationToken: req.params.token
      };

      if (!request.confirmationToken) {
        throw new ValidationError('Confirmation token is required');
      }

      const result = await this.confirmSubscriptionUseCase.execute(request);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async unsubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request: UnsubscribeRequest = {
        unsubscribeToken: req.params.token
      };

      if (!request.unsubscribeToken) {
        throw new ValidationError('Unsubscribe token is required');
      }

      const result = await this.unsubscribeUseCase.execute(request);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async getActiveSubscriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await this.getActiveSubscriptionsUseCase.execute();
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  private validateCreateSubscriptionRequest(request: CreateSubscriptionRequest): void {
    const errors: string[] = [];

    if (!request.email) {
      errors.push('Email is required');
    }

    if (!request.city) {
      errors.push('City is required');
    }

    if (!request.frequency) {
      errors.push('Frequency is required');
    } else if (!['hourly', 'daily'].includes(request.frequency)) {
      errors.push('Frequency must be either "hourly" or "daily"');
    }

    if (errors.length > 0) {
      throw new ValidationError(errors.join(', '));
    }
  }
}
