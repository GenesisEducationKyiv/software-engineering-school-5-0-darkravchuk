import { WeatherSchedule } from '../entities/WeatherSchedule';

export interface IScheduleRepository {
  findById(id: string): Promise<WeatherSchedule | null>;
  findAll(): Promise<WeatherSchedule[]>;
  findActiveSchedules(): Promise<WeatherSchedule[]>;
  save(schedule: WeatherSchedule): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IEventPublisher {
  publish(event: any): Promise<void>;
}

export interface IWeatherService {
  getCurrentWeather(location: string): Promise<{
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  }>;
}
