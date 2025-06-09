export interface WeatherParams {
    city: string;
}

export interface WeatherData {
    temperature: number;
    humidity: number;
    description: string;
}

export interface WeatherResponse {
    city: string;
    weather: WeatherData;
}

export interface ErrorResponse {
    error: string;
}