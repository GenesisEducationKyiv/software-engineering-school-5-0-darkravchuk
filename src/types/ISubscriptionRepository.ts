import { Subscription } from './Subscription';

export interface ISubscriptionRepository {
    findByEmail(email: string): Promise<Subscription | null>;
    findByConfirmationToken(token: string): Promise<Subscription | null>;
    findByUnsubscribeToken(token: string): Promise<Subscription | null>;
    findAllByFrequency(frequency: 'hourly' | 'daily'): Promise<Subscription[]>;
    findOne(filter: { email: string; city: string; frequency: 'hourly' | 'daily'; confirmed: boolean }): Promise<Subscription | null>;
    create(data: SubscriptionCreateData): Promise<Subscription>;
    update(subscription: Subscription): Promise<Subscription>;
    delete(subscription: Subscription): Promise<void>;
    findAll(): Promise<Subscription[]>;
}

export interface SubscriptionCreateData {
    email: string;
    city: string;
    frequency: 'hourly' | 'daily';
    confirmationToken: string;
    unsubscribeToken: string;
    confirmed: boolean;
}