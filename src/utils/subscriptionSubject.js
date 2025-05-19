"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SubscriptionSubject {
    constructor() {
        this.observers = []; // Store email with observer
    }
    subscribe(observer, email) {
        this.observers.push({ observer, email });
    }
    unsubscribe(observer) {
        this.observers = this.observers.filter(obs => obs.observer !== observer);
    }
    notify(message, frequency) {
        this.observers.forEach(obs => {
            if ((frequency === 'hourly' && obs.email) || frequency === 'daily') {
                obs.observer.update(message, frequency);
            }
        });
    }
}
exports.default = new SubscriptionSubject();
