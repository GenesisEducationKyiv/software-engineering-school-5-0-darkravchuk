import { Request, Response, NextFunction } from 'express';
import {
  ErrorResponse,
  SubscriptionRequest,
  subscriptionSchema,
  TokenRequest,
  tokenSchema,
} from '../types/subscription';
import {WeatherParams, weatherParamsSchema} from '../types/weather';

export const validateSubscription = (
  req: Request<{}, {}, SubscriptionRequest>,
  res: Response,
  next: NextFunction
) => {
  const { error } = subscriptionSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    res.status(400).json({ error: errorMessage } as ErrorResponse);

    return;
  }

  next();
};

export const validateToken = (
  req: Request<TokenRequest>,
  res: Response,
  next: NextFunction
) => {
  const { error } = tokenSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    res.status(400).json({ error: errorMessage } as ErrorResponse);

    return;
  }

  next();
};

export const validateWeatherParams = (req: Request<WeatherParams>, res: Response, next: NextFunction) => {
  const { error } = weatherParamsSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    res.status(400).json({ error: errorMessage } as ErrorResponse);

    return;
  }

  next();
};