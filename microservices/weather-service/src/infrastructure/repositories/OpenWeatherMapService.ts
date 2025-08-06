import { IWeatherApiService } from '../../domain/repositories/IWeatherApiService';
import { WeatherData } from '../../domain/entities/WeatherData';
import { WeatherForecast } from '../../domain/entities/WeatherForecast';
import { City } from '../../domain/value-objects/City';
import { Coordinates } from '../../domain/value-objects/Coordinates';

interface OpenWeatherMapCurrentResponse {
  name: string;
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  coord: {
    lat: number;
    lon: number;
  };
  wind?: {
    speed: number;
    deg: number;
  };
  visibility?: number;
}

interface OpenWeatherMapForecastResponse {
  city: {
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
  };
  list: Array<{
    dt: number;
    main: {
      temp_min: number;
      temp_max: number;
      humidity: number;
    };
    weather: Array<{
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
    wind?: {
      speed: number;
      deg: number;
    };
  }>;
}

interface OpenWeatherMapGeoResponse {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export class OpenWeatherMapService implements IWeatherApiService {
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
  private readonly geoUrl = 'https://api.openweathermap.org/geo/1.0';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenWeatherMap API key is required');
    }
    this.apiKey = apiKey;
  }

  async getCurrentWeatherByCity(city: City): Promise<WeatherData> {
    const url = `${this.baseUrl}/weather?q=${encodeURIComponent(city.toString())}&appid=${this.apiKey}&units=metric`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherMapCurrentResponse;
      return this.mapCurrentWeatherResponse(data);
    } catch (error) {
      throw new Error(`Failed to fetch weather for ${city.toString()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentWeatherByCoordinates(coordinates: Coordinates): Promise<WeatherData> {
    const url = `${this.baseUrl}/weather?lat=${coordinates.getLatitude()}&lon=${coordinates.getLongitude()}&appid=${this.apiKey}&units=metric`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherMapCurrentResponse;
      return this.mapCurrentWeatherResponse(data);
    } catch (error) {
      throw new Error(`Failed to fetch weather for coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getForecastByCity(city: City, days: number = 5): Promise<WeatherForecast> {
    const cnt = Math.min(days * 8, 40); // 8 periods per day, max 40 from API
    const url = `${this.baseUrl}/forecast?q=${encodeURIComponent(city.toString())}&appid=${this.apiKey}&units=metric&cnt=${cnt}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherMapForecastResponse;
      return this.mapForecastResponse(data, days);
    } catch (error) {
      throw new Error(`Failed to fetch forecast for ${city.toString()}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getForecastByCoordinates(coordinates: Coordinates, days: number = 5): Promise<WeatherForecast> {
    const cnt = Math.min(days * 8, 40);
    const url = `${this.baseUrl}/forecast?lat=${coordinates.getLatitude()}&lon=${coordinates.getLongitude()}&appid=${this.apiKey}&units=metric&cnt=${cnt}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherMapForecastResponse;
      return this.mapForecastResponse(data, days);
    } catch (error) {
      throw new Error(`Failed to fetch forecast for coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCurrentWeatherForMultipleCities(cities: City[]): Promise<WeatherData[]> {
    const promises = cities.map(city => this.getCurrentWeatherByCity(city));
    
    try {
      return await Promise.all(promises);
    } catch (error) {
      throw new Error(`Failed to fetch weather for multiple cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isServiceAvailable(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/weather?q=London&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);
      return response.ok;
    } catch {
      return false;
    }
  }

  async searchCitiesByName(partialName: string, limit: number = 5): Promise<City[]> {
    const url = `${this.geoUrl}/direct?q=${encodeURIComponent(partialName)}&limit=${limit}&appid=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap Geo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherMapGeoResponse[];
      return data.map(location => {
        const cityName = location.state 
          ? `${location.name}, ${location.state}, ${location.country}`
          : `${location.name}, ${location.country}`;
        return City.fromString(cityName);
      });
    } catch (error) {
      throw new Error(`Failed to search cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async resolveCityFromCoordinates(coordinates: Coordinates): Promise<City> {
    const url = `${this.geoUrl}/reverse?lat=${coordinates.getLatitude()}&lon=${coordinates.getLongitude()}&limit=1&appid=${this.apiKey}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OpenWeatherMap Geo API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenWeatherMapGeoResponse[];
      if (data.length === 0) {
        throw new Error('No city found for the given coordinates');
      }

      const location = data[0];
      const cityName = location.state 
        ? `${location.name}, ${location.state}, ${location.country}`
        : `${location.name}, ${location.country}`;
      
      return City.fromString(cityName);
    } catch (error) {
      throw new Error(`Failed to resolve city from coordinates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private mapCurrentWeatherResponse(data: OpenWeatherMapCurrentResponse): WeatherData {
    return WeatherData.fromExternalApi({
      city: data.name,
      temperature: data.main.temp,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      condition: {
        main: data.weather[0].main,
        description: data.weather[0].description,
        icon: data.weather[0].icon
      },
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      windSpeed: data.wind?.speed,
      windDirection: data.wind?.deg,
      visibility: data.visibility
    });
  }

  private mapForecastResponse(data: OpenWeatherMapForecastResponse, days: number): WeatherForecast {
    const dailyForecasts = new Map<string, typeof data.list>();
    
    data.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!dailyForecasts.has(dateKey)) {
        dailyForecasts.set(dateKey, []);
      }
      dailyForecasts.get(dateKey)!.push(item);
    });

    const periods = Array.from(dailyForecasts.entries())
      .slice(0, days)
      .map(([dateKey, dayData]) => {
        const temps = dayData.map(item => item.main.temp_min);
        const maxTemps = dayData.map(item => item.main.temp_max);
        const avgHumidity = dayData.reduce((sum, item) => sum + item.main.humidity, 0) / dayData.length;
        const avgPrecipitation = dayData.reduce((sum, item) => sum + (item.pop || 0), 0) / dayData.length;
        
        const conditions = dayData.map(item => item.weather[0]);
        const mostCommonCondition = conditions[0]; // Simplified - could be more sophisticated

        return {
          date: new Date(dateKey),
          minTemp: Math.min(...temps),
          maxTemp: Math.max(...maxTemps),
          condition: {
            main: mostCommonCondition.main,
            description: mostCommonCondition.description,
            icon: mostCommonCondition.icon
          },
          precipitationChance: Math.round(avgPrecipitation * 100),
          humidity: Math.round(avgHumidity),
          windSpeed: dayData[0].wind?.speed
        };
      });

    return WeatherForecast.fromExternalApi({
      city: data.city.name,
      coordinates: {
        lat: data.city.coord.lat,
        lon: data.city.coord.lon
      },
      periods,
      validHours: 24
    });
  }
}
