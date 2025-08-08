import { injectable, inject } from 'inversify';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { Subscription } from '../../domain/entities/Subscription';
import { TYPES } from '../../infrastructure/di/types';
import { GetActiveSubscriptionsResponse, SubscriptionDto } from '../dto/SubscriptionDto';

@injectable()
export class GetActiveSubscriptionsUseCase {
  constructor(
    @inject(TYPES.ISubscriptionRepository) private readonly subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(): Promise<GetActiveSubscriptionsResponse> {
    try {
      // Get all confirmed subscriptions (active ones)
      const subscriptions = await this.subscriptionRepository.findConfirmedSubscriptions();
      
      const subscriptionDtos: SubscriptionDto[] = subscriptions.map((subscription: Subscription) => ({
        id: subscription.id.toString(),
        email: subscription.email.toString(),
        city: subscription.city.toString(),
        frequency: subscription.frequency.toString() as 'hourly' | 'daily',
        status: subscription.confirmed ? 'confirmed' : 'pending',
        createdAt: subscription.createdAt,
        confirmedAt: subscription.confirmed ? subscription.updatedAt : undefined
      }));

      return {
        subscriptions: subscriptionDtos,
        total: subscriptionDtos.length
      };
    } catch (error) {
      throw error;
    }
  }
}
