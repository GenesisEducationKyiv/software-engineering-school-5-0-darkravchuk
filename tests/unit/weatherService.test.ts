import { NotFoundError } from '../../src/errors/httpError';
import { WeatherService } from '../../src/services/weatherService';
import { IWeatherProvider } from '../../src/interfaces/IWeatherProvider';
import { IWeatherData } from '../../src/interfaces/weather/IWeatherData';

describe('WeatherService Unit Tests', () => {
  let weatherService: WeatherService;
  let mockWeatherProvider: jest.Mocked<IWeatherProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWeatherProvider = {
      name: 'weatherapi.com', // Match PROVIDER_CONFIG_MAP key
      configure: jest.fn(),
      isAvailable: jest.fn().mockReturnValue(true),
      getWeather: jest.fn(),
    } as jest.Mocked<IWeatherProvider>;

    // Optionally set name with Object.defineProperty to match previous style
    Object.defineProperty(mockWeatherProvider, 'name', {
      value: 'weatherapi.com',
      writable: true,
    });

    process.env.WEATHER_API_KEY = 'test-api-key';
    process.env.OPENWEATHER_API_KEY = ''; // Match expected config
    process.env.ACCUWEATHER_API_KEY = ''; // Match expected config

    weatherService = new WeatherService(mockWeatherProvider);
  });

  afterEach(() => {
    delete process.env.WEATHER_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.ACCUWEATHER_API_KEY;
  });

  describe('constructor', () => {
    it('should configure the weather provider with the API key', () => {
      // Assert
      expect(mockWeatherProvider.configure).toHaveBeenCalledWith({
        WEATHER_API_KEY: 'test-api-key',
        OPENWEATHER_API_KEY: '',
        ACCUWEATHER_API_KEY: '',
      });
    });
  });

  describe('getWeather', () => {
    it('should return weather data for a valid city', async () => {
      // Arrange
      const city = 'Kyiv';
      const mockWeatherData: IWeatherData = {
        temperature: 20,
        description: 'Sunny',
        humidity: 60,
        pressure: 1013,
      };
      mockWeatherProvider.getWeather.mockResolvedValue(mockWeatherData);

      // Act
      const result = await weatherService.getWeather(city);

      // Assert
      expect(mockWeatherProvider.getWeather).toHaveBeenCalledWith(city);
      expect(result).toMatchObject(mockWeatherData);
    });

    it('should throw NotFoundError if the city is not found', async () => {
      // Arrange
      const city = 'InvalidCity';
      const error = new NotFoundError('City not found');
      mockWeatherProvider.getWeather.mockRejectedValue(error);

      // Act & Assert
      await expect(weatherService.getWeather(city)).rejects.toThrow(
          new NotFoundError('City not found')
      );
      expect(mockWeatherProvider.getWeather).toHaveBeenCalledWith(city);
    });

    it('should propagate other errors from the weather provider', async () => {
      // Arrange
      const city = 'Kyiv';
      const error = new Error('API error');
      mockWeatherProvider.getWeather.mockRejectedValue(error);

      // Act & Assert
      await expect(weatherService.getWeather(city)).rejects.toThrow('API error');
      expect(mockWeatherProvider.getWeather).toHaveBeenCalledWith(city);
    });
  });
});