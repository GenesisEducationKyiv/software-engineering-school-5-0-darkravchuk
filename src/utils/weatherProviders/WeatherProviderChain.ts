import { IWeatherProvider } from '../../interfaces/IWeatherProvider';
import { ILogger } from '../../interfaces/ILogger';
import { HttpError } from '../../errors/httpError';
import {IWeatherData} from "../../interfaces/weather/IWeatherData";

const PROVIDER_CONFIG_MAP: Record<string, string> = {
  'weatherapi.com': 'WEATHER_API_KEY',
  'openweathermap.org': 'OPENWEATHER_API_KEY',
  'accuweather.com': 'ACCUWEATHER_API_KEY',
};

export class WeatherProviderChain implements IWeatherProvider {
  public readonly name = 'weather-provider-chain';
  private providers: IWeatherProvider[] = [];
  private logger: ILogger;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  addProvider(provider: IWeatherProvider): void {
    this.providers.push(provider);
  }

  configure(config: Record<string, any>): void {
    this.providers.forEach(provider => {
      try {
        const configKey = PROVIDER_CONFIG_MAP[provider.name];
        if (configKey) {
          provider.configure({ apiKey: config[configKey] });
        } else {
          console.warn(`No configuration key found for provider ${provider.name}`);
        }
      } catch (error) {
        console.warn(`Failed to configure provider ${provider.name}:`, error);
      }
    });
  }

  isAvailable(): boolean {
    return this.providers.some(provider => provider.isAvailable());
  }

  async getWeather(city: string): Promise<IWeatherData> {
    const availableProviders = this.providers.filter(provider => provider.isAvailable());

    if (availableProviders.length === 0) {
      throw new HttpError(503, 'No weather providers are available');
    }

    for (const provider of availableProviders) {
      try {
        await this.logger.logAttempt(provider.name, city);

        const weatherData = await provider.getWeather(city);

        await this.logger.logResponse(provider.name, city, {
          temperature: weatherData.temperature,
          description: weatherData.description,
          humidity: weatherData.humidity,
          pressure: weatherData.pressure
        }, true);

        return weatherData;
      } catch (error) {
        await this.logger.logResponse(provider.name, city, error, false);

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