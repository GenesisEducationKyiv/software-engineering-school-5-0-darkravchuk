class HttpError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message?: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

class NotFoundError extends HttpError {
  constructor(message?: string) {
    super(404, message || 'Resource not found');
  }
}

class ConflictError extends HttpError {
  constructor(message?: string) {
    super(409, message || 'Conflict occurred');
  }
}

class WeatherUpdateError extends HttpError {
  constructor(message: string, public details?: any) {
    super(503, message);
    this.name = 'WeatherUpdateError';
    this.details = details;
    Object.setPrototypeOf(this, WeatherUpdateError.prototype);
  }
}

class BadRequestError extends HttpError {
  constructor(message: string) {
    super(400, message);
  }
}

export { HttpError, NotFoundError, ConflictError, WeatherUpdateError, BadRequestError };