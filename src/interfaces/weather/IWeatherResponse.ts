import {IWeatherData} from './IWeatherData';

export interface IWeatherResponse {
    city: string;
    weather: IWeatherData;
}