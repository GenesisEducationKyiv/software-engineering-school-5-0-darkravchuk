import {Observer, Subject, WeatherData} from '../types';
import weatherService from "../services/weatherService";

class SubscriptionSubject implements Subject {
    private observers: { observer: Observer; city: string; frequency: 'hourly' | 'daily' }[] = [];

    registerObserver(observer: Observer, city: string, frequency: 'hourly' | 'daily') {
        this.observers.push({ observer, city, frequency });
    }

    removeObserver(observer: Observer, city: string) {
        this.observers = this.observers.filter(obs => obs.observer !== observer || obs.city !== city);
    }

    async notifyObservers(city: string, frequency: 'hourly' | 'daily') {
        const observersToNotify = this.observers.filter(obs => obs.city === city && obs.frequency === frequency);
        for (const obs of observersToNotify) {
            const weather = await weatherService.getWeather(city);
            await obs.observer.update(city, weather);
        }
    }
}

export default new SubscriptionSubject();