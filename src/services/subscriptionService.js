"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const Subscription_1 = __importDefault(require("../models/Subscription")); // Note: File name corrected to match case
const subscriptionSubject_1 = __importDefault(require("../utils/subscriptionSubject"));
const weatherService_1 = __importDefault(require("./weatherService"));
class SubscriptionService {
    subscribe(email, city, frequency) {
        return __awaiter(this, void 0, void 0, function* () {
            const existing = yield Subscription_1.default.findOne({ where: { email } });
            if (existing)
                throw new Error('Email already subscribed');
            const confirmationToken = (0, uuid_1.v4)();
            const unsubscribeToken = (0, uuid_1.v4)();
            const subscription = yield Subscription_1.default.create({
                email,
                city,
                frequency,
                confirmationToken,
                unsubscribeToken,
                confirmed: false
            });
            subscriptionSubject_1.default.subscribe({
                update: (message) => console.log(`Email ${email} received: ${message}`),
            }, email);
            subscriptionSubject_1.default.notify(`New subscription request for ${email} with confirmation token ${confirmationToken}`, frequency);
            return { message: 'Subscription created. Check your email for confirmation.', confirmationToken };
        });
    }
    confirmSubscription(confirmationToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const subscription = yield Subscription_1.default.findOne({ where: { confirmationToken } });
            if (!subscription)
                throw new Error('Token not found');
            if (subscription.confirmed)
                throw new Error('Already confirmed');
            subscription.confirmed = true;
            yield subscription.save();
            subscriptionSubject_1.default.notify(`Subscription confirmed for ${subscription.email}`, subscription.frequency);
            return { message: 'Subscription confirmed successfully' };
        });
    }
    unsubscribe(unsubscribeToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const subscription = yield Subscription_1.default.findOne({ where: { unsubscribeToken } });
            if (!subscription)
                throw new Error('Token not found');
            subscriptionSubject_1.default.unsubscribe({
                update: () => { },
            });
            yield subscription.destroy();
            subscriptionSubject_1.default.notify(`Unsubscribed ${subscription.email}`, subscription.frequency);
            return { message: 'Unsubscribed successfully' };
        });
    }
    sendWeatherUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            const subscriptions = yield Subscription_1.default.findAll({ where: { confirmed: true } });
            for (const sub of subscriptions) {
                const weather = yield weatherService_1.default.getWeather(sub.city);
                const message = `Weather update for ${sub.city}: ${weather.temperature}°C, ${weather.description}`;
                subscriptionSubject_1.default.notify(message, sub.frequency);
            }
        });
    }
}
exports.default = new SubscriptionService();
