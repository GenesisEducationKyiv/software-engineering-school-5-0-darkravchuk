import Joi from 'joi';

export interface WeatherParams {
    city: string;
}

export interface WeatherData {
    temperature: number;
    humidity: number;
    description: string;
}

export interface WeatherResponse {
    city: string;
    weather: WeatherData;
}

export interface ErrorResponse {
    error: string;
}

export const weatherParamsSchema = Joi.object<WeatherParams>({
  city: Joi.string().trim().required().messages({
    'string.empty': 'City parameter is required',
    'any.required': 'City parameter is required',
  }),
});