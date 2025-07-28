import { NotFoundError } from '../../src/errors/httpError';
import {WeatherService} from '../../src/services/weatherService';
import {IWeatherProvider} from '../../src/types/IWeatherProvider';
import {WeatherDataDTO} from '../../src/services/WeatherDataDTO';

jest.mock('../../src/types/IWeatherProvider');

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

    it('should configure the weather provider with an empty string if API key is not set', () => {
      // Arrange
      delete process.env.WEATHER_API_KEY;

      // Assert
      expect(mockWeatherProvider.configure).toHaveBeenCalledWith({
        apiKey: '',
      });
    });
  });

  describe('getWeather', () => {
    it('should return weather data for a valid city', async () => {
      // Arrange
      const city = 'Kyiv';
      const mockWeatherData: WeatherDataDTO = new WeatherDataDTO(
        20,
        'Sunny',
        60,
        1013
      );
      mockWeatherProvider.getWeather.mockResolvedValue(mockWeatherData);

      // Act
      const result = await weatherService.getWeather(city);

      // Assert
      expect(mockWeatherProvider.getWeather).toHaveBeenCalledWith(city);
      expect(result).toEqual(mockWeatherData);
      expect(result).toBeInstanceOf(WeatherDataDTO);
      expect(result).toMatchObject({
        temperature: 20,
        description: 'Sunny',
        humidity: 60,
        pressure: 1013,
      });
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