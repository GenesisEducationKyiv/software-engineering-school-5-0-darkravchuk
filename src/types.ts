export interface WeatherData {
    temperature: number;
    humidity: number;
    description: string;
}

export interface Observer {
    update(city: string, weather: WeatherData): Promise<void>;
}

