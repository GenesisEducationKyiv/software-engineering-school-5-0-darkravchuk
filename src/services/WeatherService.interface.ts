import {WeatherDataDTO} from './WeatherDataDTO';

export interface IWeatherService {
    getWeather(city: string): Promise<WeatherDataDTO>;
}