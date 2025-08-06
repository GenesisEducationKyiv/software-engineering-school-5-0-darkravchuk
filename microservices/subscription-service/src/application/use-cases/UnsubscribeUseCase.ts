import { injectable, inject } from 'inversify';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { IEventPublisher } from '../../domain/services/IEventPublisher';
import { Token } from '../../domain/value-objects/Token';
import { SubscriptionCancelledEvent } from '../../domain/events/SubscriptionEvents';
import { 
  UnsubscribeRequest, 
  UnsubscribeResponse 
} from '../dto/SubscriptionDto';
import { 
  ValidationError, 
  NotFoundError 
} from '../errors/ApplicationErrors';
import { TYPES } from '../../infrastructure/di/types';

@injectable()
export class UnsubscribeUseCase {
  constructor(
    @inject(TYPES.ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.IEventPublisher) private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(request: UnsubscribeRequest): Promise<UnsubscribeResponse> {
    try {
      // 1. Validate and create token value object
      const unsubscribeToken = this.createToken(request.unsubscribeToken);

      // 2. Find subscription by unsubscribe token
      const subscription = await this.subscriptionRepository.findByUnsubscribeToken(unsubscribeToken);
      if (!subscription) {
        throw new NotFoundError('Token not found');
      }

      // 3. Publish domain event before deletion
      await this.publishSubscriptionCancelledEvent(subscription);

      // 4. Delete subscription
      await this.subscriptionRepository.delete(subscription);

      return {
        message: 'Unsubscribed successfully'
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new Error(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createToken(tokenString: string): Token {
    try {
      return Token.fromString(tokenString);
    } catch (error) {
      throw new ValidationError(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async publishSubscriptionCancelledEvent(subscription: any): Promise<void> {
    const event = new SubscriptionCancelledEvent(
      subscription.id.toString(),
      subscription.email.toString(),
      subscription.city.toString()
    );

    try {
      await this.eventPublisher.publish(event);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to publish SubscriptionCancelledEvent:', error);
    }
  }
}
