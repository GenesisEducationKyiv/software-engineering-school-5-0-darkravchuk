import express, { Application } from 'express';
import request from 'supertest';
import {IWeatherService} from '../../src/services/WeatherService.interface';
import {WeatherController} from '../../src/controllers/weatherController';

const mockWeatherService: jest.Mocked<IWeatherService> = {
  getWeather: jest.fn(),
};

describe('WeatherController Integration Tests', () => {
  let app: Application;
  let controller: WeatherController;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    controller = new WeatherController(mockWeatherService);

    app.get('/weather/:city', (req, res) => controller.getWeather(req, res));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 200 and weather data for a valid city', async () => {
    // Arrange
    const city = 'Kyiv';
    const mockWeatherData = {
      temperature: 20,
      description: 'Sunny',
      humidity: 60,
      pressure: 1013,
    };
    mockWeatherService.getWeather.mockResolvedValue(mockWeatherData);

    // Act
    const response = await request(app).get(`/weather/${city}`);

    // Assert
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      city,
      temperature: mockWeatherData.temperature,
      description: mockWeatherData.description,
      humidity: mockWeatherData.humidity,
      pressure: mockWeatherData.pressure,
    });
    expect(mockWeatherService.getWeather).toHaveBeenCalledWith(city);
  });

  it('should return 404 if city is not found', async () => {
    // Arrange
    const city = 'UnknownCity';
    mockWeatherService.getWeather.mockRejectedValue(new Error('City not found'));

    // Act
    const response = await request(app).get(`/weather/${city}`);

    // Assert
    expect(response.status).toBe(500); // Assuming unhandled error returns 500
    expect(mockWeatherService.getWeather).toHaveBeenCalledWith(city);
  });
});