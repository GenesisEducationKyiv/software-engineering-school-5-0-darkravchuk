import { Request, Response, NextFunction, RequestHandler } from 'express';
import { HttpError } from '../errors/httpError';
import { ErrorResponse } from '../types/subscription';

export const handleError = <P = any, ResBody = any, ReqBody = any, ReqQuery = qs.ParsedQs>(
  controllerFunction: (req: Request<P, any, ReqBody, ReqQuery>, res: Response<ResBody>) => Promise<void>
): RequestHandler<P, ResBody | ErrorResponse, ReqBody, ReqQuery> => {
  return async (req: Request<P, any, ReqBody, ReqQuery>, res: Response<ResBody | ErrorResponse>, next: NextFunction) => {
    try {
      await controllerFunction(req, res);
    } catch (error) {

      if (error instanceof HttpError) {

        res.status(error.statusCode).json({ error: error.message } as ErrorResponse);
      } else if (error instanceof Error) {

        console.error('Unexpected error:', error.stack);
        res.status(500).json({ error: 'Internal server error' } as ErrorResponse);
      } else {

        res.status(500).json({ error: 'Unknown error occurred' } as ErrorResponse);
      }
    }
  };
};