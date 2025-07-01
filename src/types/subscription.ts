import Joi from 'joi';

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

export const subscriptionSchema = Joi.object<SubscriptionRequest>({
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required',
  }),
  city: Joi.string().required().messages({
    'any.required': 'City is required',
  }),
  frequency: Joi.string().valid('hourly', 'daily').required().messages({
    'any.only': 'Frequency must be either "hourly" or "daily"',
    'any.required': 'Frequency is required',
  }),
});

export const tokenSchema = Joi.object<TokenRequest>({
  token: Joi.string().required().messages({
    'any.required': 'Token is required',
  }),
});