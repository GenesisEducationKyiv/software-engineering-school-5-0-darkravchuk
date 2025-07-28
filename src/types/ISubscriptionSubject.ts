import {Observer} from './Observer';

export interface ISubscriptionSubject {
    registerObserver(observer: Observer, city: string, frequency: 'hourly' | 'daily'): Promise<void>;
    removeObserver(observer: Observer, city: string): Promise<void>;
    notifyObservers(city: string, frequency: 'hourly' | 'daily'): Promise<void>;
}