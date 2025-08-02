export interface ISubscription {
    id: number;
    email: string;
    city: string;
    frequency: 'hourly' | 'daily';
    confirmed: boolean;
    confirmationToken: string;
    unsubscribeToken: string;
}