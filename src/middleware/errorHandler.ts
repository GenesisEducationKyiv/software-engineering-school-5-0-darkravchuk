import { Request, Response, NextFunction, RequestHandler } from 'express';
import { HttpError } from '../errors/httpError';
import {IErrorResponse} from '../interfaces/subscription/IErrorResponse';

export const handleError = <P = any, ResBody = any, ReqBody = any, ReqQuery = qs.ParsedQs>(
  controllerFunction: (req: Request<P, any, ReqBody, ReqQuery>, res: Response<ResBody>) => Promise<void>
): RequestHandler<P, ResBody | IErrorResponse, ReqBody, ReqQuery> => {
  return async (req: Request<P, any, ReqBody, ReqQuery>, res: Response<ResBody | IErrorResponse>, next: NextFunction) => {
    try {
      await controllerFunction(req, res);
    } catch (error) {

      if (error instanceof HttpError) {

        res.status(error.statusCode).json({ error: error.message } as IErrorResponse);
      } else if (error instanceof Error) {

        console.error('Unexpected error:', error.stack);
        res.status(500).json({ error: 'Internal server error' } as IErrorResponse);
      } else {

        res.status(500).json({ error: 'Unknown error occurred' } as IErrorResponse);
      }
    }
  };
};