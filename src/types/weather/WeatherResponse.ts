import {WeatherData} from "./WeatherData";

export interface WeatherResponse {
    city: string;
    weather: WeatherData;
}