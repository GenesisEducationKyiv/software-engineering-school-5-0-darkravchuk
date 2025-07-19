import { WeatherDataDTO } from '../services/WeatherDataDTO';

export interface IWeatherProvider {
    getWeather(city: string): Promise<WeatherDataDTO>;
    configure(config: Record<string, any>): void;
}