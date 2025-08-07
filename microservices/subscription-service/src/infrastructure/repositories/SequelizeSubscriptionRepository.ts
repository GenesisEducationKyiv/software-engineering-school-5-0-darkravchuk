import { injectable } from 'inversify';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { Subscription } from '../../domain/entities/Subscription';
import { Email } from '../../domain/value-objects/Email';
import { Token } from '../../domain/value-objects/Token';
import { SubscriptionId } from '../../domain/value-objects/SubscriptionId';
import { City } from '../../domain/value-objects/City';
import { Frequency } from '../../domain/value-objects/Frequency';
import { SubscriptionModel } from '../database/models/SubscriptionModel';

@injectable()
export class SequelizeSubscriptionRepository implements ISubscriptionRepository {
  
  async save(subscription: Subscription): Promise<void> {
    const data = {
      email: subscription.email.toString(),
      city: subscription.city.toString(),
      frequency: subscription.frequency.toString() as 'hourly' | 'daily',
      confirmed: subscription.confirmed,
      confirmationToken: subscription.confirmationToken.toString(),
      unsubscribeToken: subscription.unsubscribeToken.toString(),
    };

    try {
      // Check if subscription exists (by looking at internal ID)
      const existingModel = await SubscriptionModel.findOne({
        where: { email: data.email }
      });

      if (existingModel) {
        // Update existing
        await existingModel.update({
          confirmed: data.confirmed,
          // Don't update tokens or other immutable fields
        });
      } else {
        // Create new
        await SubscriptionModel.create(data);
      }
    } catch (error) {
      throw new Error(`Failed to save subscription: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findById(id: SubscriptionId): Promise<Subscription | null> {
    try {
      const model = await SubscriptionModel.findByPk(id.toNumber());
      return model ? this.toDomain(model) : null;
    } catch (error) {
      // If ID is not numeric, it won't be found in our current setup
      return null;
    }
  }

  async findByEmail(email: Email): Promise<Subscription | null> {
    const model = await SubscriptionModel.findOne({
      where: { email: email.toString() }
    });
    return model ? this.toDomain(model) : null;
  }

  async findByConfirmationToken(token: Token): Promise<Subscription | null> {
    const model = await SubscriptionModel.findOne({
      where: { confirmationToken: token.toString() }
    });
    return model ? this.toDomain(model) : null;
  }

  async findByUnsubscribeToken(token: Token): Promise<Subscription | null> {
    const model = await SubscriptionModel.findOne({
      where: { unsubscribeToken: token.toString() }
    });
    return model ? this.toDomain(model) : null;
  }

  async findConfirmedByFrequency(frequency: Frequency): Promise<Subscription[]> {
    const models = await SubscriptionModel.findAll({
      where: { 
        confirmed: true,
        frequency: frequency.toString()
      }
    });
    return models.map(model => this.toDomain(model));
  }

  async findConfirmedByCityAndFrequency(city: City, frequency: Frequency): Promise<Subscription[]> {
    const models = await SubscriptionModel.findAll({
      where: { 
        confirmed: true,
        city: city.toString(),
        frequency: frequency.toString()
      }
    });
    return models.map(model => this.toDomain(model));
  }

  async delete(subscription: Subscription): Promise<void> {
    await SubscriptionModel.destroy({
      where: { email: subscription.email.toString() }
    });
  }

  async findConfirmedSubscriptions(): Promise<Subscription[]> {
    try {
      const models = await SubscriptionModel.findAll({
        where: { confirmed: true }
      });
      return models.map(model => this.toDomain(model));
    } catch (error) {
      throw new Error(`Failed to find confirmed subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await SubscriptionModel.count({
      where: { email: email.toString() }
    });
    return count > 0;
  }

  private toDomain(model: SubscriptionModel): Subscription {
    return Subscription.fromPersistence(
      SubscriptionId.fromNumber(model.id),
      Email.fromString(model.email),
      City.fromString(model.city),
      Frequency.fromString(model.frequency),
      model.confirmed,
      Token.fromString(model.confirmationToken),
      Token.fromString(model.unsubscribeToken),
      model.createdAt,
      model.updatedAt
    );
  }
}
