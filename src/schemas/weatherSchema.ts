import Joi from 'joi';
import {IWeatherParams} from '../interfaces/weather/IWeatherParams';

export const weatherSchema = Joi.object<IWeatherParams>({
  city: Joi.string().trim().required().messages({
    'string.empty': 'City parameter is required',
    'any.required': 'City parameter is required',
  }),
});