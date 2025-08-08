import { injectable, inject } from 'inversify';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { IEventPublisher } from '../../domain/services/IEventPublisher';
import { Token } from '../../domain/value-objects/Token';
import { 
  ConfirmSubscriptionRequest, 
  ConfirmSubscriptionResponse 
} from '../dto/SubscriptionDto';
import { 
  ValidationError, 
  NotFoundError 
} from '../errors/ApplicationErrors';
import { TYPES } from '../../infrastructure/di/types';

@injectable()
export class ConfirmSubscriptionUseCase {
  constructor(
    @inject(TYPES.ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.IEventPublisher) private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(request: ConfirmSubscriptionRequest): Promise<ConfirmSubscriptionResponse> {
    try {
      // 1. Validate and create token value object
      const confirmationToken = this.createToken(request.confirmationToken);

      // 2. Find subscription by confirmation token
      const subscription = await this.subscriptionRepository.findByConfirmationToken(confirmationToken);
      if (!subscription) {
        throw new NotFoundError('Token not found');
      }

      // 3. Check if already confirmed
      if (subscription.isConfirmed()) {
        throw new ValidationError('Already confirmed');
      }

      // 4. Confirm subscription
      subscription.confirm();

      // 5. Save updated subscription
      await this.subscriptionRepository.save(subscription);

      return {
        message: 'Subscription confirmed successfully'
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to confirm subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createToken(tokenString: string): Token {
    try {
      return Token.fromString(tokenString);
    } catch (error) {
      throw new ValidationError(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
