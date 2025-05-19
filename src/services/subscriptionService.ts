import { v4 as uuidv4 } from 'uuid';
import Subscription from '../models/Subscription';
import SubscriptionSubject from '../utils/subscriptionSubject';
import { sendConfirmationEmail } from '../utils/sendGrid';
import EmailObserver from '../utils/emailObserver';

class SubscriptionService {
    async subscribe(email: string, city: string, frequency: "hourly" | "daily") {
        const existing = await Subscription.findOne({ where: { email } });
        if (existing) throw new Error('Email already subscribed');

        const confirmationToken = uuidv4();
        const unsubscribeToken = uuidv4();
        const subscription = await Subscription.create({
            email,
            city,
            frequency,
            confirmationToken,
            unsubscribeToken,
            confirmed: false
        });

        await sendConfirmationEmail(email, confirmationToken);

        return { message: 'Subscription created. Check your email for confirmation.', confirmationToken };
    }

    async confirmSubscription(confirmationToken: string) {
        const subscription = await Subscription.findOne({ where: { confirmationToken } });
        if (!subscription) throw new Error('Token not found');
        if (subscription.confirmed) throw new Error('Already confirmed');
        subscription.confirmed = true;
        await subscription.save();

        const observer = new EmailObserver(subscription.email, subscription.unsubscribeToken);
        await SubscriptionSubject.registerObserver(observer, subscription.city, subscription.frequency);

        return { message: 'Subscription confirmed successfully' };
    }

    async unsubscribe(unsubscribeToken: string) {
        const subscription = await Subscription.findOne({ where: { unsubscribeToken } });
        if (!subscription) throw new Error('Token not found');
        await SubscriptionSubject.removeObserver(new EmailObserver(subscription.email, subscription.unsubscribeToken), subscription.city);
        await subscription.destroy();
        return { message: 'Unsubscribed successfully' };
    }

    async sendWeatherUpdates(frequency: 'hourly' | 'daily') {
        try {
            const subscriptions = await Subscription.findAll({ where: { confirmed: true, frequency } });

            if (subscriptions.length === 0) {
                return;
            }

            const cities = [...new Set(subscriptions.map(sub => sub.city))];

            for (const city of cities) {
                await SubscriptionSubject.notifyObservers(city, frequency);
            }
        } catch (error) {
            console.error(`[ERROR] Failed to send weather updates for ${frequency}:`, error);
            throw error;
        }
    }
}

export default new SubscriptionService();