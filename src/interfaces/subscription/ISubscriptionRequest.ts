export interface ISubscriptionRequest {
    email: string;
    city: string;
    frequency: 'hourly' | 'daily';
}