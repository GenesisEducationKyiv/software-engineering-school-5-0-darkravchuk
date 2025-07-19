
export interface ISubscriptionService {
    subscribe(email: string, city: string, frequency: 'hourly' | 'daily'): Promise<{
        message: string;
        confirmationToken: string;
    }>;

    confirmSubscription(confirmationToken: string): Promise<{
        message: string;
    }>;

    unsubscribe(unsubscribeToken: string): Promise<{
        message: string;
    }>;

    sendWeatherUpdates(frequency: 'hourly' | 'daily'): Promise<void>;
}