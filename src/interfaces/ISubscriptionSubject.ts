import {IObserver} from './IObserver';

export interface ISubscriptionSubject {
    registerObserver(observer: IObserver, city: string, frequency: 'hourly' | 'daily'): Promise<void>;
    removeObserver(observer: IObserver, city: string): Promise<void>;
    notifyObservers(city: string, frequency: 'hourly' | 'daily'): Promise<void>;
}