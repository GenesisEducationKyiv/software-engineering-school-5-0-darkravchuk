import axios from 'axios';
import { HttpError, NotFoundError } from '../../errors/httpError';

export interface WeatherProviderErrorContext {
  providerName: string;
  city: string;
  checkAuthError?: boolean; // Some providers might not need 401 checks
}

export class WeatherProviderErrorHandler {
  static handleError(error: unknown, context: WeatherProviderErrorContext): never {
    const { providerName, city, checkAuthError = true } = context;

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      
      // Map HTTP status codes to appropriate errors
      switch (status) {
      case 404:
        throw new NotFoundError(`Weather data for ${city} not found`);
      case 401:
        if (checkAuthError) {
          throw new HttpError(401, `Invalid API key for ${providerName}`);
        }
        // Fall through to 500 if auth error checking is disabled
        break;
      case 429:
        throw new HttpError(429, `Rate limit exceeded for ${providerName}`);
      case 500:
      case 502:
      case 503:
      case 504:
        throw new HttpError(503, `Service temporarily unavailable for ${providerName}`);
      default:
        throw new HttpError(500, `Failed to fetch weather for ${city} from ${providerName}`);
      }
    }

    // Handle non-Axios errors
    if (error instanceof HttpError || error instanceof NotFoundError) {
      throw error; // Re-throw our custom errors as-is
    }

    // Handle network/timeout errors
    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('ECONNABORTED')) {
        throw new HttpError(408, `Request timeout for ${providerName}`);
      }
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        throw new HttpError(503, `Service unavailable for ${providerName}`);
      }
    }

    // Generic error fallback
    throw new HttpError(500, `Unexpected error fetching weather for ${city} from ${providerName}`);
  }

  // Convenience method for providers that don't need auth error checking
  static handleErrorWithoutAuth(error: unknown, providerName: string, city: string): never {
    return this.handleError(error, { providerName, city, checkAuthError: false });
  }
} 