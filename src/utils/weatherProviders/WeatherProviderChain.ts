import { IWeatherProvider } from '../../types/IWeatherProvider';
import { WeatherDataDTO } from '../../services/WeatherDataDTO';
import { WeatherLogger } from './WeatherLogger';
import { HttpError } from '../../errors/httpError';

export class WeatherProviderChain implements IWeatherProvider {
  public readonly name = 'weather-provider-chain';
  private providers: IWeatherProvider[] = [];
  private logger: WeatherLogger;

  constructor() {
    this.logger = new WeatherLogger();
  }

  addProvider(provider: IWeatherProvider): void {
    this.providers.push(provider);
  }

  configure(config: Record<string, any>): void {
    this.providers.forEach(provider => {
      try {
        if (provider.name === 'weatherapi.com') {
          provider.configure({ apiKey: config.WEATHER_API_KEY });
        } else if (provider.name === 'openweathermap.org') {
          provider.configure({ apiKey: config.OPENWEATHER_API_KEY });
        } else if (provider.name === 'accuweather.com') {
          provider.configure({ apiKey: config.ACCUWEATHER_API_KEY });
        }
      } catch (error) {
        console.warn(`Failed to configure provider ${provider.name}:`, error);
      }
    });
  }

  isAvailable(): boolean {
    return this.providers.some(provider => provider.isAvailable());
  }

  async getWeather(city: string): Promise<WeatherDataDTO> {
    const availableProviders = this.providers.filter(provider => provider.isAvailable());
    
    if (availableProviders.length === 0) {
      throw new HttpError(503, 'No weather providers are available');
    }

    for (const provider of availableProviders) {
      try {
        this.logger.logAttempt(provider.name, city);
        
        const weatherData = await provider.getWeather(city);
        
        this.logger.logResponse(provider.name, city, {
          temperature: weatherData.temperature,
          description: weatherData.description,
          humidity: weatherData.humidity,
          pressure: weatherData.pressure
        }, true);
        
        return weatherData;
      } catch (error) {
        this.logger.logResponse(provider.name, city, error, false);
        
        if (provider === availableProviders[availableProviders.length - 1]) {
          throw error;
        }
        
        console.warn(`Provider ${provider.name} failed for ${city}, trying next provider...`);
      }
    }

    throw new HttpError(503, 'All weather providers failed');
  }

  getProviderStatus(): Array<{ name: string; available: boolean }> {
    return this.providers.map(provider => ({
      name: provider.name,
      available: provider.isAvailable()
    }));
  }
} 