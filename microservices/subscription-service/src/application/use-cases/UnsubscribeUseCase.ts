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
import { logger } from '../../infrastructure/logging/logger';
import { metricsCollector } from '../../infrastructure/metrics/metricsCollector';
import { externalServiceLogger } from '../../presentation/middleware/observability';

@injectable()
export class UnsubscribeUseCase {
  constructor(
    @inject(TYPES.ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.IEventPublisher) private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(request: UnsubscribeRequest): Promise<UnsubscribeResponse> {
    const startTime = Date.now();
    
    logger.info('Starting unsubscribe operation', {
      operation: 'Unsubscribe',
      tokenPrefix: request.unsubscribeToken.substring(0, 8) + '...'
    });

    try {
      logger.debug('Validating unsubscribe token');
      const unsubscribeToken = this.createToken(request.unsubscribeToken);

      logger.debug('Looking up subscription by unsubscribe token');
      const subscription = await this.subscriptionRepository.findByUnsubscribeToken(unsubscribeToken);
      if (!subscription) {
        throw new NotFoundError('Token not found');
      }

      logger.debug('Found subscription for unsubscribe', {
        subscriptionId: subscription.id.toString(),
        email: `${subscription.email.toString().substring(0, 3)}***@***`,
        city: subscription.city.toString(),
        isConfirmed: subscription.isConfirmed()
      });

      await this.publishSubscriptionCancelledEvent(subscription);

      logger.debug('Deleting subscription', {
        subscriptionId: subscription.id.toString()
      });
      await this.subscriptionRepository.delete(subscription);

      metricsCollector.recordUnsubscribe();

      const duration = Date.now() - startTime;
      logger.logOperation('Unsubscribe', true, {
        duration: `${duration}ms`,
        subscriptionId: subscription.id.toString(),
        email: `${subscription.email.toString().substring(0, 3)}***@***`,
        city: subscription.city.toString()
      });

      return {
        message: 'Unsubscribed successfully'
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logOperation('Unsubscribe', false, {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        tokenPrefix: request.unsubscribeToken.substring(0, 8) + '...'
      });

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

    const startTime = Date.now();
    
    try {
      await this.eventPublisher.publish(event);
      const duration = Date.now() - startTime;
      
      externalServiceLogger('eventPublisher').logCall('publish', true, duration, {
        eventType: 'SubscriptionCancelledEvent',
        subscriptionId: subscription.id.toString()
      });
      
      logger.logEvent('SubscriptionCancelledEvent', subscription.id.toString(), {
        email: `${subscription.email.toString().substring(0, 3)}***@***`,
        city: subscription.city.toString(),
        frequency: subscription.frequency.toString()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      externalServiceLogger('eventPublisher').logCall('publish', false, duration, {
        eventType: 'SubscriptionCancelledEvent',
        subscriptionId: subscription.id.toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      
      logger.warn('Failed to publish SubscriptionCancelledEvent', {
        error: error instanceof Error ? error.message : String(error),
        subscriptionId: subscription.id.toString(),
        eventType: 'SubscriptionCancelledEvent'
      });
    }
  }
}
