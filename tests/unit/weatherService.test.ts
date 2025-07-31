import { NotFoundError } from '../../src/errors/httpError';
import {WeatherService} from '../../src/services/weatherService';
import {IWeatherProvider} from '../../src/interfaces/IWeatherProvider';

jest.mock('../../src/interfaces/IWeatherProvider');

describe('WeatherService Unit Tests', () => {
  let weatherService: WeatherService;
  let mockWeatherProvider: jest.Mocked<IWeatherProvider>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockWeatherProvider = {
      configure: jest.fn(),
      getWeather: jest.fn(),
    } as jest.Mocked<IWeatherProvider>;

    process.env.WEATHER_API_KEY = 'test-api-key';

    weatherService = new WeatherService(mockWeatherProvider);
  });

  afterEach(() => {
    delete process.env.WEATHER_API_KEY;
  });

  describe('constructor', () => {
    it('should configure the weather provider with the API key', () => {
      // Assert
      expect(mockWeatherProvider.configure).toHaveBeenCalledWith({
        apiKey: 'test-api-key',
      });
    });
  });

  describe('getWeather', () => {
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