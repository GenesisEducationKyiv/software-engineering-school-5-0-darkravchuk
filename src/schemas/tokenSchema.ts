import Joi from 'joi';
import {ITokenRequest} from '../interfaces/subscription/ITokenRequest';

export const tokenSchema = Joi.object<ITokenRequest>({
  token: Joi.string().required().messages({
    'any.required': 'Token is required',
  }),
});