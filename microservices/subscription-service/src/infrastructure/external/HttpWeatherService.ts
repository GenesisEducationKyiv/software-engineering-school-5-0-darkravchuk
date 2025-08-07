import { injectable } from 'inversify';
import axios from 'axios';
import { IWeatherService } from '../../domain/services/IWeatherService';
import { WeatherData } from '../../domain/services/IEmailService';
import { City } from '../../domain/value-objects/City';

@injectable()
export class HttpWeatherService implements IWeatherService {
  private readonly weatherServiceUrl: string;

  constructor() {
    this.weatherServiceUrl = process.env.WEATHER_SERVICE_URL || 'http://localhost:3002';
  }

  async getWeatherData(city: City): Promise<WeatherData> {
    try {
      const response = await axios.get(
        `${this.weatherServiceUrl}/api/v1/weather/${encodeURIComponent(city.toString())}`,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        temperature: response.data.temperature,
        description: response.data.description,
        humidity: response.data.humidity,
        pressure: response.data.pressure
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.log(`[WEATHER SERVICE UNAVAILABLE] Using mock data for ${city.toString()}`);
          return this.getMockWeatherData(city);
        }
        
        if (error.response?.status === 404) {
          throw new Error(`City "${city.toString()}" not found`);
        }
      }

      console.error('Failed to get weather data:', error);
      throw new Error(`Failed to get weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async validateCity(city: City): Promise<boolean> {
    try {
      await this.getWeatherData(city);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return false;
      }

      console.log(`[WEATHER SERVICE UNAVAILABLE] Assuming city ${city.toString()} is valid`);
      return true;
    }
  }

  private getMockWeatherData(city: City): WeatherData {
    const cityHash = city.toString().toLowerCase().charCodeAt(0);
    const temperatures = [15, 18, 22, 25, 28, 12, 8];
    const descriptions = ['Sunny', 'Cloudy', 'Partly cloudy', 'Rainy', 'Clear'];
    const humidities = [45, 60, 55, 70, 40];

    return {
      temperature: temperatures[cityHash % temperatures.length],
      description: descriptions[cityHash % descriptions.length],
      humidity: humidities[cityHash % humidities.length],
      pressure: 1013 + (cityHash % 20) - 10
    };
  }
}
