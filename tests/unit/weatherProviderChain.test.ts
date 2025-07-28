import { WeatherProviderChain } from '../../src/utils/weatherProviders/WeatherProviderChain';
import { WeatherApiComProvider } from '../../src/utils/weatherProviders/WeatherApiComProvider';
import { OpenWeatherMapProvider } from '../../src/utils/weatherProviders/OpenWeatherMapProvider';
import { AccuWeatherProvider } from '../../src/utils/weatherProviders/AccuWeatherProvider';
import { WeatherDataDTO } from '../../src/services/WeatherDataDTO';
import { HttpError } from '../../src/errors/httpError';

jest.mock('../../src/utils/weatherProviders/WeatherApiComProvider');
jest.mock('../../src/utils/weatherProviders/OpenWeatherMapProvider');
jest.mock('../../src/utils/weatherProviders/AccuWeatherProvider');

describe('WeatherProviderChain', () => {
  let chain: WeatherProviderChain;
  let mockWeatherApiProvider: jest.Mocked<WeatherApiComProvider>;
  let mockOpenWeatherProvider: jest.Mocked<OpenWeatherMapProvider>;
  let mockAccuWeatherProvider: jest.Mocked<AccuWeatherProvider>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    chain = new WeatherProviderChain();
    
    mockWeatherApiProvider = new WeatherApiComProvider() as jest.Mocked<WeatherApiComProvider>;
    mockOpenWeatherProvider = new OpenWeatherMapProvider() as jest.Mocked<OpenWeatherMapProvider>;
    mockAccuWeatherProvider = new AccuWeatherProvider() as jest.Mocked<AccuWeatherProvider>;
    
    Object.defineProperty(mockWeatherApiProvider, 'name', { value: 'weatherapi.com', writable: true });
    mockWeatherApiProvider.isAvailable.mockReturnValue(true);
    mockWeatherApiProvider.getWeather.mockResolvedValue(
      new WeatherDataDTO(20, 'Sunny', 60, 1013)
    );
    
    Object.defineProperty(mockOpenWeatherProvider, 'name', { value: 'openweathermap.org', writable: true });
    mockOpenWeatherProvider.isAvailable.mockReturnValue(true);
    mockOpenWeatherProvider.getWeather.mockResolvedValue(
      new WeatherDataDTO(22, 'Cloudy', 65, 1010)
    );
    
    Object.defineProperty(mockAccuWeatherProvider, 'name', { value: 'accuweather.com', writable: true });
    mockAccuWeatherProvider.isAvailable.mockReturnValue(true);
    mockAccuWeatherProvider.getWeather.mockResolvedValue(
      new WeatherDataDTO(18, 'Rainy', 80, 1008)
    );
  });

  describe('Provider Chain Setup', () => {
    it('should add providers to the chain', () => {
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      const status = chain.getProviderStatus();
      expect(status).toHaveLength(2);
      expect(status[0].name).toBe('weatherapi.com');
      expect(status[1].name).toBe('openweathermap.org');
    });

    it('should configure all providers', () => {
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      chain.configure({
        WEATHER_API_KEY: 'test-key-1',
        OPENWEATHER_API_KEY: 'test-key-2'
      });
      
      expect(mockWeatherApiProvider.configure).toHaveBeenCalledWith({ apiKey: 'test-key-1' });
      expect(mockOpenWeatherProvider.configure).toHaveBeenCalledWith({ apiKey: 'test-key-2' });
    });
  });

  describe('Fallback Logic', () => {
    it('should use first available provider', async () => {
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      const result = await chain.getWeather('London');
      
      expect(mockWeatherApiProvider.getWeather).toHaveBeenCalledWith('London');
      expect(mockOpenWeatherProvider.getWeather).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(WeatherDataDTO);
    });

    it('should fallback to second provider when first fails', async () => {
      mockWeatherApiProvider.getWeather.mockRejectedValue(new Error('API Error'));
      
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      const result = await chain.getWeather('London');
      
      expect(mockWeatherApiProvider.getWeather).toHaveBeenCalledWith('London');
      expect(mockOpenWeatherProvider.getWeather).toHaveBeenCalledWith('London');
      expect(result).toBeInstanceOf(WeatherDataDTO);
    });

    it('should throw error when all providers fail', async () => {
      mockWeatherApiProvider.getWeather.mockRejectedValue(new Error('API Error 1'));
      mockOpenWeatherProvider.getWeather.mockRejectedValue(new Error('API Error 2'));
      
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      await expect(chain.getWeather('London')).rejects.toThrow('API Error 2');
    });

    it('should only try available providers', async () => {
      mockWeatherApiProvider.isAvailable.mockReturnValue(false);
      mockOpenWeatherProvider.isAvailable.mockReturnValue(true);
      
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      const result = await chain.getWeather('London');
      
      expect(mockWeatherApiProvider.getWeather).not.toHaveBeenCalled();
      expect(mockOpenWeatherProvider.getWeather).toHaveBeenCalledWith('London');
      expect(result).toBeInstanceOf(WeatherDataDTO);
    });
  });

  describe('Availability Check', () => {
    it('should return true if at least one provider is available', () => {
      mockWeatherApiProvider.isAvailable.mockReturnValue(false);
      mockOpenWeatherProvider.isAvailable.mockReturnValue(true);
      
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      expect(chain.isAvailable()).toBe(true);
    });

    it('should return false if no providers are available', () => {
      mockWeatherApiProvider.isAvailable.mockReturnValue(false);
      mockOpenWeatherProvider.isAvailable.mockReturnValue(false);
      
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      expect(chain.isAvailable()).toBe(false);
    });
  });

  describe('Provider Status', () => {
    it('should return status of all providers', () => {
      mockWeatherApiProvider.isAvailable.mockReturnValue(true);
      mockOpenWeatherProvider.isAvailable.mockReturnValue(false);
      
      chain.addProvider(mockWeatherApiProvider);
      chain.addProvider(mockOpenWeatherProvider);
      
      const status = chain.getProviderStatus();
      
      expect(status).toEqual([
        { name: 'weatherapi.com', available: true },
        { name: 'openweathermap.org', available: false }
      ]);
    });
  });
}); 