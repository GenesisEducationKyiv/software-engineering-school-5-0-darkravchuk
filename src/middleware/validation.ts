import { Request, Response, NextFunction } from 'express';
import {ISubscriptionRequest} from '../interfaces/subscription/ISubscriptionRequest';
import {subscriptionSchema} from '../schemas/subscriptionSchema';
import {IErrorResponse} from '../interfaces/subscription/IErrorResponse';
import {ITokenRequest} from '../interfaces/subscription/ITokenRequest';
import {tokenSchema} from '../schemas/tokenSchema';
import {weatherSchema} from '../schemas/weatherSchema';
import {IWeatherParams} from '../interfaces/weather/IWeatherParams';


export const validateSubscription = (
  req: Request<{}, {}, ISubscriptionRequest>,
  res: Response,
  next: NextFunction
) => {
  const { error } = subscriptionSchema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    res.status(400).json({ error: errorMessage } as IErrorResponse);

    return;
  }

  next();
};

export const validateToken = (
  req: Request<ITokenRequest>,
  res: Response,
  next: NextFunction
) => {
  const { error } = tokenSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    res.status(400).json({ error: errorMessage } as IErrorResponse);

    return;
  }

  next();
};

export const validateWeatherParams = (req: Request<IWeatherParams>, res: Response, next: NextFunction) => {
  const { error } = weatherSchema.validate(req.params, { abortEarly: false });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    res.status(400).json({ error: errorMessage } as IErrorResponse);

    return;
  }

  next();
};