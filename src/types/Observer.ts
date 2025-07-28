import {WeatherData} from './weather/WeatherData';

export interface Observer {
    update(city: string, weather: WeatherData): Promise<void>;
}