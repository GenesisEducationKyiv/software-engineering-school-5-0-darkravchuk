export interface WeatherData {
    temperature: number;
    humidity: number;
    description: string;
}

export interface Observer {
    update(city: string, weather: WeatherData): Promise<void>;
}

export interface Subject {
    registerObserver(observer: Observer, city: string, frequency: 'hourly' | 'daily'): void;
    removeObserver(observer: Observer, city: string): void;
    notifyObservers(city: string, frequency: 'hourly' | 'daily'): Promise<void>;
}