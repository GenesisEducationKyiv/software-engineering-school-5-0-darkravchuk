import Joi from "joi";
import {TokenRequest} from "../types/subscription/TokenRequest";

export const tokenSchema = Joi.object<TokenRequest>({
    token: Joi.string().required().messages({
        'any.required': 'Token is required',
    }),
});