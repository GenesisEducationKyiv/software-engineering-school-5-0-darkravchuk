import { Request, Response, NextFunction } from 'express';
import {SubscriptionRequest} from "../types/subscription/SubscriptionRequest";
import {subscriptionSchema} from "../schemas/subscriptionSchema";
import {ErrorResponse} from "../types/subscription/ErrorResponse";
import {TokenRequest} from "../types/subscription/TokenRequest";
import {tokenSchema} from "../schemas/tokenSchema";
import {weatherSchema} from "../schemas/weatherSchema";
import {WeatherParams} from "../types/weather/WeatherParams";


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
  const { error } = weatherSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    res.status(400).json({ error: errorMessage } as ErrorResponse);

    return;
  }

  next();
};