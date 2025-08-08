import axios from 'axios';
import { IWeatherService } from '../../domain/interfaces/DomainInterfaces';

export class WeatherApiService implements IWeatherService {
  constructor(
    private readonly weatherServiceUrl: string = 'http://weather-service:3001'
  ) {}

  async getCurrentWeather(location: string): Promise<{
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  }> {
    try {
      const response = await axios.get(`${this.weatherServiceUrl}/weather/current`, {
        params: { location },
        timeout: 5000
      });

      const data = response.data;
      
      return {
        temperature: data.temperature,
        condition: data.condition,
        humidity: data.humidity,
        windSpeed: data.windSpeed
      };
    } catch (error) {
      console.error(`Failed to fetch weather for ${location}:`, error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`Weather data not found for location: ${location}`);
        }
        if (error.code === 'ECONNREFUSED') {
          throw new Error('Weather service is unavailable');
        }
      }
      
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
