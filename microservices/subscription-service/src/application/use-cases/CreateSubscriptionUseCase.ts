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

@injectable()
export class CreateSubscriptionUseCase {
  constructor(
    @inject(TYPES.ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository,
    @inject(TYPES.IEmailService) private readonly emailService: IEmailService,
    @inject(TYPES.IWeatherService) private readonly weatherService: IWeatherService,
    @inject(TYPES.IEventPublisher) private readonly eventPublisher: IEventPublisher
  ) {}

  async execute(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    try {
      // 1. Validate and create value objects
      const email = this.createEmail(request.email);
      const city = this.createCity(request.city);
      const frequency = this.createFrequency(request.frequency);

      // 2. Check if email already exists
      await this.ensureEmailNotExists(email);

      // 3. Validate city with weather service
      await this.validateCityWithWeatherService(city);

      // 4. Create subscription with tokens
      const confirmationToken = Token.generate();
      const unsubscribeToken = Token.generate();
      
      const subscription = Subscription.create(
        email,
        city,
        frequency,
        confirmationToken,
        unsubscribeToken
      );

      // 5. Save subscription
      await this.subscriptionRepository.save(subscription);

      // 6. Send confirmation email
      // await this.sendConfirmationEmail(email, confirmationToken);

      // 7. Publish domain event
      await this.publishSubscriptionCreatedEvent(subscription);

      return {
        message: 'Subscription created. Check your email for confirmation.',
        confirmationToken: confirmationToken.toString()
      };
    } catch (error) {
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
    try {
      const isValid = await this.weatherService.validateCity(city);
      if (!isValid) {
        throw new ValidationError(`City "${city.toString()}" not found in weather service`);
      }
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
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

    try {
      await this.eventPublisher.publish(event);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to publish SubscriptionCreatedEvent:', error);
    }
  }
}
