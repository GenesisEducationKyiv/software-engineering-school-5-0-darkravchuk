export interface SubscriptionRequest {
    email: string;
    city: string;
    frequency: 'hourly' | 'daily';
}