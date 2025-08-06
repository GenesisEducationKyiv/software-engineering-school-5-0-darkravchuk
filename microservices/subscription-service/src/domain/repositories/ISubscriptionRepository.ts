import { Subscription } from '../entities/Subscription';
import { Email } from '../value-objects/Email';
import { Token } from '../value-objects/Token';
import { SubscriptionId } from '../value-objects/SubscriptionId';
import { City } from '../value-objects/City';
import { Frequency } from '../value-objects/Frequency';

export interface ISubscriptionRepository {
  /**
   * Save a subscription to the repository
   */
  save(subscription: Subscription): Promise<void>;

  /**
   * Find subscription by ID
   */
  findById(id: SubscriptionId): Promise<Subscription | null>;

  /**
   * Find subscription by email
   */
  findByEmail(email: Email): Promise<Subscription | null>;

  /**
   * Find subscription by confirmation token
   */
  findByConfirmationToken(token: Token): Promise<Subscription | null>;

  /**
   * Find subscription by unsubscribe token
   */
  findByUnsubscribeToken(token: Token): Promise<Subscription | null>;

  /**
   * Find all confirmed subscriptions by frequency
   */
  findConfirmedByFrequency(frequency: Frequency): Promise<Subscription[]>;

  /**
   * Find all confirmed subscriptions by city and frequency
   */
  findConfirmedByCityAndFrequency(city: City, frequency: Frequency): Promise<Subscription[]>;

  /**
   * Find all confirmed subscriptions (for scheduling service)
   */
  findConfirmedSubscriptions(): Promise<Subscription[]>;

  /**
   * Delete a subscription
   */
  delete(subscription: Subscription): Promise<void>;

  /**
   * Check if email already exists
   */
  existsByEmail(email: Email): Promise<boolean>;
}
