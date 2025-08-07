import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '../../application/errors/ApplicationErrors';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
  method: string;
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  };

  // Handle application errors
  if (error instanceof ApplicationError) {
    errorResponse.error.code = error.code;
    errorResponse.error.message = error.message;
    res.status(error.statusCode).json(errorResponse);
    return;
  }

  // Handle validation errors from express-validator or similar
  if (error.name === 'ValidationError') {
    errorResponse.error.code = 'VALIDATION_ERROR';
    errorResponse.error.message = error.message;
    res.status(400).json(errorResponse);
    return;
  }

  // Handle Sequelize errors
  if (error.name === 'SequelizeValidationError') {
    errorResponse.error.code = 'DATABASE_VALIDATION_ERROR';
    errorResponse.error.message = 'Database validation failed';
    errorResponse.error.details = (error as any).errors?.map((e: any) => ({
      field: e.path,
      message: e.message
    }));
    res.status(400).json(errorResponse);
    return;
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    errorResponse.error.code = 'DUPLICATE_ENTRY';
    errorResponse.error.message = 'Resource already exists';
    res.status(409).json(errorResponse);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    errorResponse.error.code = 'INVALID_TOKEN';
    errorResponse.error.message = 'Invalid authentication token';
    res.status(401).json(errorResponse);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    errorResponse.error.code = 'TOKEN_EXPIRED';
    errorResponse.error.message = 'Authentication token has expired';
    res.status(401).json(errorResponse);
    return;
  }

  // Default to 500 internal server error
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.message = error.message;
    errorResponse.error.details = error.stack;
  }

  res.status(500).json(errorResponse);
};
