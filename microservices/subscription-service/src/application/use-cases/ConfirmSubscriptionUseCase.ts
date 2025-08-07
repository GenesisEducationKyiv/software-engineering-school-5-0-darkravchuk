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
import { logger } from '../../infrastructure/logging/logger';
import { metricsCollector } from '../../infrastructure/metrics/metricsCollector';

@injectable()
export class ConfirmSubscriptionUseCase {
  constructor(
    @inject(TYPES.ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.IEventPublisher) private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(request: ConfirmSubscriptionRequest): Promise<ConfirmSubscriptionResponse> {
    const startTime = Date.now();
    
    logger.info('Starting subscription confirmation', {
      operation: 'ConfirmSubscription',
      tokenPrefix: request.confirmationToken.substring(0, 8) + '...'
    });

    try {
      logger.debug('Validating confirmation token');
      const confirmationToken = this.createToken(request.confirmationToken);

      logger.debug('Looking up subscription by confirmation token');
      const subscription = await this.subscriptionRepository.findByConfirmationToken(confirmationToken);
      if (!subscription) {
        throw new NotFoundError('Token not found');
      }

      logger.debug('Checking if subscription is already confirmed', {
        subscriptionId: subscription.id.toString(),
        isConfirmed: subscription.isConfirmed()
      });
      
      if (subscription.isConfirmed()) {
        throw new ValidationError('Already confirmed');
      }

      logger.debug('Confirming subscription', {
        subscriptionId: subscription.id.toString(),
        email: `${subscription.email.toString().substring(0, 3)}***@***`
      });
      subscription.confirm();

      logger.debug('Saving confirmed subscription');
      await this.subscriptionRepository.save(subscription);

      metricsCollector.recordSubscriptionConfirmed();

      const duration = Date.now() - startTime;
      logger.logOperation('ConfirmSubscription', true, {
        duration: `${duration}ms`,
        subscriptionId: subscription.id.toString(),
        email: `${subscription.email.toString().substring(0, 3)}***@***`,
        city: subscription.city.toString()
      });

      logger.logEvent('SubscriptionConfirmed', subscription.id.toString(), {
        email: `${subscription.email.toString().substring(0, 3)}***@***`,
        city: subscription.city.toString(),
        frequency: subscription.frequency.toString()
      });

      return {
        message: 'Subscription confirmed successfully'
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logOperation('ConfirmSubscription', false, {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        tokenPrefix: request.confirmationToken.substring(0, 8) + '...'
      });

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
