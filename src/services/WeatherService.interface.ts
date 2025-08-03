import {IWeatherData} from '../interfaces/weather/IWeatherData';

export interface IWeatherService {
    getWeather(city: string): Promise<IWeatherData>;
}