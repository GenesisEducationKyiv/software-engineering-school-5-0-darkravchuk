import { ISubscription } from './ISubscription';

export interface ISubscriptionRepository {
    findByEmail(email: string): Promise<ISubscription | null>;
    findByConfirmationToken(token: string): Promise<ISubscription | null>;
    findByUnsubscribeToken(token: string): Promise<ISubscription | null>;
    findAllByFrequency(frequency: 'hourly' | 'daily'): Promise<ISubscription[]>;
    findOne(filter: { email: string; city: string; frequency: 'hourly' | 'daily'; confirmed: boolean }): Promise<ISubscription | null>;
    create(data: SubscriptionCreateData): Promise<ISubscription>;
    update(subscription: ISubscription): Promise<ISubscription>;
    delete(subscription: ISubscription): Promise<void>;
    findAll(): Promise<ISubscription[]>;
}

export interface SubscriptionCreateData {
    email: string;
    city: string;
    frequency: 'hourly' | 'daily';
    confirmationToken: string;
    unsubscribeToken: string;
    confirmed: boolean;
}