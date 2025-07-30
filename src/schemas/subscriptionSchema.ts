import Joi from 'joi';
import {ISubscriptionRequest} from '../interfaces/subscription/ISubscriptionRequest';

export const subscriptionSchema = Joi.object<ISubscriptionRequest>({
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
