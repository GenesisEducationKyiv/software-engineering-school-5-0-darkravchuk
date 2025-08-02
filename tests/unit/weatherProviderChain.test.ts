import { WeatherProviderChain } from '../../src/utils/weatherProviders/WeatherProviderChain';
import { IWeatherProvider } from '../../src/interfaces/IWeatherProvider';
import { ILogger } from '../../src/interfaces/ILogger';
import { IWeatherData } from '../../src/interfaces/weather/IWeatherData';
import { HttpError } from '../../src/errors/httpError';

describe('WeatherProviderChain', () => {
  let chain: WeatherProviderChain;
  let mockProvider1: jest.Mocked<IWeatherProvider>;
  let mockProvider2: jest.Mocked<IWeatherProvider>;
  let mockProvider3: jest.Mocked<IWeatherProvider>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      logResponse: jest.fn().mockResolvedValue(undefined),
      logAttempt: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<ILogger>;

    chain = new WeatherProviderChain(mockLogger);

    mockProvider1 = {
      name: 'weatherapi.com',
      isAvailable: jest.fn().mockReturnValue(true),
      getWeather: jest.fn(),
      configure: jest.fn(),
    } as jest.Mocked<IWeatherProvider>;

    mockProvider2 = {
      name: 'openweathermap.org',
      isAvailable: jest.fn().mockReturnValue(true),
      getWeather: jest.fn(),
      configure: jest.fn(),
    } as jest.Mocked<IWeatherProvider>;

    mockProvider3 = {
      name: 'accuweather.com',
      isAvailable: jest.fn().mockReturnValue(true),
      getWeather: jest.fn(),
      configure: jest.fn(),
    } as jest.Mocked<IWeatherProvider>;

    const mockWeatherData: IWeatherData = {
      temperature: 20,
      description: 'Sunny',
      humidity: 60,
      pressure: 1013,
    };

    mockProvider1.getWeather.mockResolvedValue(mockWeatherData);
    mockProvider2.getWeather.mockResolvedValue({
      ...mockWeatherData,
      temperature: 22,
      description: 'Cloudy',
    });
    mockProvider3.getWeather.mockResolvedValue({
      ...mockWeatherData,
      temperature: 18,
      description: 'Rainy',
    });
  });

  describe('Provider Chain Setup', () => {
    it('should add providers to the chain', () => {
      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      const status = chain.getProviderStatus();
      expect(status).toHaveLength(2);
      expect(status[0].name).toBe('weatherapi.com');
      expect(status[1].name).toBe('openweathermap.org');
    });

    it('should handle missing API keys gracefully', () => {
      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      chain.configure({});

      expect(mockProvider1.configure).toHaveBeenCalledWith({});
      expect(mockProvider2.configure).toHaveBeenCalledWith({});
    });

    it('should handle empty provider array', () => {
      const status = chain.getProviderStatus();
      expect(status).toHaveLength(0);
      expect(chain.isAvailable()).toBe(false);
    });

    it('should throw error when getting weather with empty provider array', async () => {
      await expect(chain.getWeather('London')).rejects.toThrow('No weather providers are available');
    });
  });

  describe('API Key Configuration', () => {
    it('should handle providers becoming unavailable after configuration', () => {
      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      expect(chain.isAvailable()).toBe(true);

      mockProvider1.isAvailable.mockReturnValue(false);
      mockProvider2.isAvailable.mockReturnValue(false);

      expect(chain.isAvailable()).toBe(false);
    });
  });

  describe('Fallback Logic', () => {
    it('should use first available provider', async () => {
      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      const result = await chain.getWeather('London');

      expect(mockProvider1.getWeather).toHaveBeenCalledWith('London');
      expect(mockProvider2.getWeather).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        temperature: 20,
        description: 'Sunny',
        humidity: 60,
        pressure: 1013,
      });
      expect(mockLogger.logAttempt).toHaveBeenCalledWith('weatherapi.com', 'London');
      expect(mockLogger.logResponse).toHaveBeenCalledWith('weatherapi.com', 'London', expect.any(Object), true);
    });

    it('should fallback to second provider when first fails', async () => {
      mockProvider1.getWeather.mockRejectedValue(new Error('API Error'));

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      const result = await chain.getWeather('London');

      expect(mockProvider1.getWeather).toHaveBeenCalledWith('London');
      expect(mockProvider2.getWeather).toHaveBeenCalledWith('London');
      expect(result).toMatchObject({
        temperature: 22,
        description: 'Cloudy',
        humidity: 60,
        pressure: 1013,
      });
      expect(mockLogger.logAttempt).toHaveBeenCalledWith('weatherapi.com', 'London');
      expect(mockLogger.logAttempt).toHaveBeenCalledWith('openweathermap.org', 'London');
      expect(mockLogger.logResponse).toHaveBeenCalledWith('weatherapi.com', 'London', expect.any(Error), false);
      expect(mockLogger.logResponse).toHaveBeenCalledWith('openweathermap.org', 'London', expect.any(Object), true);
    });

    it('should fallback through multiple providers', async () => {
      mockProvider1.getWeather.mockRejectedValue(new Error('API Error 1'));
      mockProvider2.getWeather.mockRejectedValue(new Error('API Error 2'));

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);
      chain.addProvider(mockProvider3);

      const result = await chain.getWeather('London');

      expect(mockProvider1.getWeather).toHaveBeenCalledWith('London');
      expect(mockProvider2.getWeather).toHaveBeenCalledWith('London');
      expect(mockProvider3.getWeather).toHaveBeenCalledWith('London');
      expect(result).toMatchObject({
        temperature: 18,
        description: 'Rainy',
        humidity: 60,
        pressure: 1013,
      });
    });

    it('should throw error when all providers fail', async () => {
      mockProvider1.getWeather.mockRejectedValue(new Error('API Error 1'));
      mockProvider2.getWeather.mockRejectedValue(new Error('API Error 2'));

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      await expect(chain.getWeather('London')).rejects.toThrow('API Error 2');
    });

    it('should only try available providers', async () => {
      mockProvider1.isAvailable.mockReturnValue(false);
      mockProvider2.isAvailable.mockReturnValue(true);

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      const result = await chain.getWeather('London');

      expect(mockProvider1.getWeather).not.toHaveBeenCalled();
      expect(mockProvider2.getWeather).toHaveBeenCalledWith('London');
      expect(result).toMatchObject({
        temperature: 22,
        description: 'Cloudy',
        humidity: 60,
        pressure: 1013,
      });
    });

    it('should skip unavailable providers in the middle of the chain', async () => {
      mockProvider2.isAvailable.mockReturnValue(false);

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);
      chain.addProvider(mockProvider3);

      const result = await chain.getWeather('London');

      expect(mockProvider1.getWeather).toHaveBeenCalledWith('London');
      expect(mockProvider2.getWeather).not.toHaveBeenCalled();
      expect(mockProvider3.getWeather).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        temperature: 20,
        description: 'Sunny',
        humidity: 60,
        pressure: 1013,
      });
    });
  });

  describe('Availability Check', () => {
    it('should return true if at least one provider is available', () => {
      mockProvider1.isAvailable.mockReturnValue(false);
      mockProvider2.isAvailable.mockReturnValue(true);

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      expect(chain.isAvailable()).toBe(true);
    });

    it('should return false if no providers are available', () => {
      mockProvider1.isAvailable.mockReturnValue(false);
      mockProvider2.isAvailable.mockReturnValue(false);

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      expect(chain.isAvailable()).toBe(false);
    });

    it('should return false for empty provider array', () => {
      expect(chain.isAvailable()).toBe(false);
    });
  });

  describe('Provider Status', () => {
    it('should return status of all providers', () => {
      mockProvider1.isAvailable.mockReturnValue(true);
      mockProvider2.isAvailable.mockReturnValue(false);

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      const status = chain.getProviderStatus();

      expect(status).toEqual([
        { name: 'weatherapi.com', available: true },
        { name: 'openweathermap.org', available: false },
      ]);
    });

    it('should return empty array for no providers', () => {
      const status = chain.getProviderStatus();
      expect(status).toEqual([]);
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts gracefully', async () => {
      mockProvider1.getWeather.mockRejectedValue(new Error('Network timeout'));
      mockProvider2.getWeather.mockRejectedValue(new Error('Network timeout'));

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      await expect(chain.getWeather('London')).rejects.toThrow('Network timeout');
    });

    it('should handle invalid city names', async () => {
      mockProvider1.getWeather.mockRejectedValue(new Error('City not found'));
      mockProvider2.getWeather.mockRejectedValue(new Error('City not found'));

      chain.addProvider(mockProvider1);
      chain.addProvider(mockProvider2);

      await expect(chain.getWeather('InvalidCity123')).rejects.toThrow('City not found');
    });
  });
});