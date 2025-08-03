import {IWeatherData} from './weather/IWeatherData';

export interface IObserver {
    update(city: string, weather: IWeatherData): Promise<void>;
}