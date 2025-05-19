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
const Subscription_1 = __importDefault(require("../models/Subscription"));
const subscriptionSubject_1 = __importDefault(require("../utils/subscriptionSubject"));
const emailService_1 = require("../utils/emailService");
const emailObserver_1 = __importDefault(require("../utils/emailObserver"));
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
            yield (0, emailService_1.sendConfirmationEmail)(email, confirmationToken);
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
            const observer = new emailObserver_1.default(subscription.email, subscription.unsubscribeToken);
            subscriptionSubject_1.default.registerObserver(observer, subscription.city, subscription.frequency);
            return { message: 'Subscription confirmed successfully' };
        });
    }
    unsubscribe(unsubscribeToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const subscription = yield Subscription_1.default.findOne({ where: { unsubscribeToken } });
            if (!subscription)
                throw new Error('Token not found');
            subscriptionSubject_1.default.removeObserver(new emailObserver_1.default(subscription.email, subscription.unsubscribeToken), subscription.city);
            yield subscription.destroy();
            return { message: 'Unsubscribed successfully' };
        });
    }
    sendWeatherUpdates(frequency) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[DEBUG] Starting sendWeatherUpdates for ${frequency} subscriptions...`);
                const subscriptions = yield Subscription_1.default.findAll({ where: { confirmed: true, frequency } });
                console.log(`[DEBUG] ${frequency} subscriptions fetched:`, subscriptions);
                if (subscriptions.length === 0) {
                    console.log(`[DEBUG] No confirmed ${frequency} subscriptions found.`);
                    return;
                }
                const cities = [...new Set(subscriptions.map(sub => sub.city))];
                console.log(`[DEBUG] ${frequency} cities to process:`, cities);
                for (const city of cities) {
                    console.log(`[DEBUG] Notifying observers for ${city} (${frequency})...`);
                    yield subscriptionSubject_1.default.notifyObservers(city, frequency);
                }
            }
            catch (error) {
                console.error(`[ERROR] Failed to send weather updates for ${frequency}:`, error);
                throw error; // Re-throw to ensure it’s caught in index.ts
            }
        });
    }
}
exports.default = new SubscriptionService();
