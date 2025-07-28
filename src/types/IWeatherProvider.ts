import { WeatherDataDTO } from '../services/WeatherDataDTO';

export interface IWeatherProvider {
    readonly name: string;
    getWeather(city: string): Promise<WeatherDataDTO>;
    configure(config: Record<string, any>): void;
    isAvailable(): boolean;
}