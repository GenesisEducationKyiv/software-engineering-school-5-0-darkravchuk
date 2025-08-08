export interface CreateSubscriptionRequest {
  email: string;
  city: string;
  frequency: 'hourly' | 'daily';
}

export interface CreateSubscriptionResponse {
  message: string;
  confirmationToken: string;
}

export interface ConfirmSubscriptionRequest {
  confirmationToken: string;
}

export interface ConfirmSubscriptionResponse {
  message: string;
}

export interface UnsubscribeRequest {
  unsubscribeToken: string;
}

export interface UnsubscribeResponse {
  message: string;
}

export interface SendWeatherUpdatesRequest {
  frequency: 'hourly' | 'daily';
}

export interface GetSubscriptionsRequest {
  frequency?: 'hourly' | 'daily';
  city?: string;
  confirmed?: boolean;
}

export interface SubscriptionDto {
  id: string;
  email: string;
  city: string;
  frequency: 'hourly' | 'daily';
  status: string;
  createdAt: Date;
  confirmedAt?: Date;
}

export interface GetActiveSubscriptionsResponse {
  subscriptions: SubscriptionDto[];
  total: number;
}
