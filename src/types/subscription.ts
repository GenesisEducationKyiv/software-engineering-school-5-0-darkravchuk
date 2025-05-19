export interface SubscriptionRequest {
    email: string;
    city: string;
    frequency: 'hourly' | 'daily';
}

export interface TokenRequest {
    token: string;
}

export interface SuccessResponse {
    message: string;
    confirmationToken?: string;
}

export interface ErrorResponse {
    error: string;
}