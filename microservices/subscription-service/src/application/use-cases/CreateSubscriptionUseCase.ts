import { injectable, inject } from 'inversify';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { IEmailService } from '../../domain/services/IEmailService';
import { IWeatherService } from '../../domain/services/IWeatherService';
import { IEventPublisher } from '../../domain/services/IEventPublisher';
import { Subscription } from '../../domain/entities/Subscription';
import { Email } from '../../domain/value-objects/Email';
import { City } from '../../domain/value-objects/City';
import { Frequency } from '../../domain/value-objects/Frequency';
import { Token } from '../../domain/value-objects/Token';
import { SubscriptionCreatedEvent } from '../../domain/events/SubscriptionEvents';
import { 
  CreateSubscriptionRequest, 
  CreateSubscriptionResponse 
} from '../dto/SubscriptionDto';
import { 
  ValidationError, 
  ConflictError, 
  ExternalServiceError 
} from '../errors/ApplicationErrors';
import { TYPES } from '../../infrastructure/di/types';
import { logger } from '../../infrastructure/logging/logger';
import { metricsCollector } from '../../infrastructure/metrics/metricsCollector';
import { externalServiceLogger } from '../../presentation/middleware/observability';

@injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @inject(TYPES.ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.IEmailService) private readonly emailService: IEmailService,
    @inject(TYPES.IWeatherService) private readonly weatherService: IWeatherService,
    @inject(TYPES.IEventPublisher) private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    const startTime = Date.now();
    
    logger.info('Starting subscription creation', {
      operation: 'CreateSubscription',
      email: `${request.email.substring(0, 3)}***@***`,
      city: request.city,
      frequency: request.frequency
    });

    try {
      logger.debug('Validating input parameters');
      const email = this.createEmail(request.email);
      const city = this.createCity(request.city);
      const frequency = this.createFrequency(request.frequency);

      logger.debug('Checking for existing email subscription');
      await this.ensureEmailNotExists(email);

      logger.debug('Validating city with weather service', { city: city.toString() });
      await this.validateCityWithWeatherService(city);

      logger.debug('Creating subscription entity');
      const confirmationToken = Token.generate();
      const unsubscribeToken = Token.generate();
      
      const subscription = Subscription.create(
        email,
        city,
        frequency,
        confirmationToken,
        unsubscribeToken
      );

      logger.debug('Saving subscription to repository', {
        subscriptionId: subscription.id.toString()
      });
      await this.subscriptionRepository.save(subscription);

      await this.publishSubscriptionCreatedEvent(subscription);

      metricsCollector.recordSubscriptionCreated(city.toString(), frequency.toString());

      const duration = Date.now() - startTime;
      logger.logOperation('CreateSubscription', true, {
        duration: `${duration}ms`,
        subscriptionId: subscription.id.toString(),
        email: `${email.toString().substring(0, 3)}***@***`,
        city: city.toString(),
        frequency: frequency.toString()
      });

      return {
        message: 'Subscription created. Check your email for confirmation.',
        confirmationToken: confirmationToken.toString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.logOperation('CreateSubscription', false, {
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : String(error),
        email: `${request.email.substring(0, 3)}***@***`,
        city: request.city,
        frequency: request.frequency
      });

      if (error instanceof ValidationError || 
          error instanceof ConflictError || 
          error instanceof ExternalServiceError) {
        throw error;
      }
      throw new Error(`Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createEmail(emailString: string): Email {
    try {
      return Email.fromString(emailString);
    } catch (error) {
      throw new ValidationError(`Invalid email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createCity(cityString: string): City {
    try {
      return City.fromString(cityString);
    } catch (error) {
      throw new ValidationError(`Invalid city: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private createFrequency(frequencyString: string): Frequency {
    try {
      return Frequency.fromString(frequencyString);
    } catch (error) {
      throw new ValidationError(`Invalid frequency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async ensureEmailNotExists(email: Email): Promise<void> {
    const exists = await this.subscriptionRepository.existsByEmail(email);
    if (exists) {
      throw new ConflictError('Email already subscribed');
    }
  }

  private async validateCityWithWeatherService(city: City): Promise<void> {
    const startTime = Date.now();
    
    try {
      const isValid = await this.weatherService.validateCity(city);
      const duration = Date.now() - startTime;
      
      externalServiceLogger('weather').logCall('validateCity', true, duration, {
        city: city.toString(),
        isValid
      });
      
      if (!isValid) {
        throw new ValidationError(`City "${city.toString()}" not found in weather service`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        externalServiceLogger('weather').logCall('validateCity', false, duration, {
          city: city.toString(),
          error: error.message
        });
        throw error;
      }
      
      externalServiceLogger('weather').logCall('validateCity', false, duration, {
        city: city.toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      
      throw new ExternalServiceError(error instanceof Error ? error.message : 'Unknown error', 'WeatherService');
    }
  }

  private async publishSubscriptionCreatedEvent(subscription: Subscription): Promise<void> {
    const event = new SubscriptionCreatedEvent(
      subscription.id.toString(),
      subscription.email.toString(),
      subscription.city.toString(),
      subscription.confirmationToken.toString()
    );

    const startTime = Date.now();
    
    try {
      await this.eventPublisher.publish(event);
      const duration = Date.now() - startTime;
      
      externalServiceLogger('eventPublisher').logCall('publish', true, duration, {
        eventType: 'SubscriptionCreatedEvent',
        subscriptionId: subscription.id.toString()
      });
      
      logger.logEvent('SubscriptionCreatedEvent', subscription.id.toString(), {
        email: `${subscription.email.toString().substring(0, 3)}***@***`,
        city: subscription.city.toString(),
        frequency: subscription.frequency.toString()
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      externalServiceLogger('eventPublisher').logCall('publish', false, duration, {
        eventType: 'SubscriptionCreatedEvent',
        subscriptionId: subscription.id.toString(),
        error: error instanceof Error ? error.message : String(error)
      });
      
      // Log error but don't fail the operation
      logger.warn('Failed to publish SubscriptionCreatedEvent', {
        error: error instanceof Error ? error.message : String(error),
        subscriptionId: subscription.id.toString(),
        eventType: 'SubscriptionCreatedEvent'
      });
    }
  }
}
