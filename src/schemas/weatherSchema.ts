import Joi from "joi";
import {WeatherParams} from "../types/weather/WeatherParams";

export const weatherSchema = Joi.object<WeatherParams>({
  city: Joi.string().trim().required().messages({
    'string.empty': 'City parameter is required',
    'any.required': 'City parameter is required',
  }),
});