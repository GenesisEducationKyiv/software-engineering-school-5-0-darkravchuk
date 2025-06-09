import { Observer, Subject } from '../types';
import weatherService from '../services/weatherService';
import EmailObserver from './emailObserver';
import Subscription from '../models/Subscription';

class SubscriptionSubject implements Subject {
    private observers: { observer: Observer; city: string; frequency: 'hourly' | 'daily' }[] = [];

    constructor() {
        this.syncWithDB().catch(err => {
        });
    }

    private async syncWithDB(): Promise<void> {
        try {
            const subscriptions = await Subscription.findAll({ where: { confirmed: true } });

            this.observers = subscriptions.map(subscription => ({
                observer: new EmailObserver(subscription.email, subscription.unsubscribeToken),
                city: subscription.city,
                frequency: subscription.frequency,
            }));
        } catch (error) {
            throw error;
        }
    }

    async registerObserver(observer: Observer, city: string, frequency: 'hourly' | 'daily') {
        const subscription = await Subscription.findOne({
            where: { email: (observer as EmailObserver).getEmail(), city, frequency, confirmed: true }
        });

        if (!subscription) {
            return;
        }

        await this.syncWithDB();

        const exists = this.observers.some(
            obs => obs.observer instanceof EmailObserver &&
                (obs.observer as EmailObserver).getEmail() === (observer as EmailObserver).getEmail() &&
                obs.city === city &&
                obs.frequency === frequency
        );

        if (!exists) {
            this.observers.push({ observer, city, frequency });
        }
    }

    async removeObserver(observer: Observer, city: string) {
        await this.syncWithDB();

        this.observers = this.observers.filter(obs => {
            if (!(obs.observer instanceof EmailObserver) || !(observer instanceof EmailObserver)) {
                return obs.observer !== observer || obs.city !== city;
            }
            return !(obs.observer.equals(observer) && obs.city === city);
        });
    }

    async notifyObservers(city: string, frequency: 'hourly' | 'daily') {

        await this.syncWithDB();

        const observersToNotify = this.observers.filter(obs => obs.city === city && obs.frequency === frequency);

        for (const obs of observersToNotify) {
            const weather = await weatherService.getWeather(city);

            await obs.observer.update(city, weather);
        }
    }
}

export default new SubscriptionSubject();