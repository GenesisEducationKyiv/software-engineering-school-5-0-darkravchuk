import {IWeatherData} from './weather/IWeatherData';

export interface IWeatherProvider {
    getWeather(city: string): Promise<IWeatherData>;
    configure(config: Record<string, any>): void;
}