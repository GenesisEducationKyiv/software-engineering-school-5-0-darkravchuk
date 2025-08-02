import {IWeatherData} from './weather/IWeatherData';

export interface IWeatherProvider {
    readonly name: string;
    getWeather(city: string): Promise<IWeatherData>;
    configure(config: Record<string, any>): void;
    isAvailable(): boolean;
}