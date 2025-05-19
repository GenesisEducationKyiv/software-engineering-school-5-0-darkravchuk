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
const subscriptionService_1 = __importDefault(require("../services/subscriptionService"));
class SubscriptionController {
    subscribe(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { email, city, frequency } = req.body;
            if (!email || !city || !frequency) {
                return res.status(400).json({ error: 'email, city, and frequency are required' });
            }
            if (!['hourly', 'daily'].includes(frequency)) {
                return res.status(400).json({ error: 'Frequency must be hourly or daily' });
            }
            try {
                const result = yield subscriptionService_1.default.subscribe(email, city, frequency);
                res.status(200).json(result);
            }
            catch (error) {
                if (error.message === 'Email already subscribed') {
                    res.status(409).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to subscribe: ' + error.message });
                }
            }
        });
    }
    confirmSubscription(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = req.params;
            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }
            try {
                const result = yield subscriptionService_1.default.confirmSubscription(token);
                res.status(200).json(result);
            }
            catch (error) {
                if (error.message === 'Token not found' || error.message === 'Already confirmed') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to confirm subscription: ' + error.message });
                }
            }
        });
    }
    unsubscribe(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token } = req.params;
            if (!token) {
                return res.status(400).json({ error: 'Token is required' });
            }
            try {
                const result = yield subscriptionService_1.default.unsubscribe(token);
                res.status(200).json(result);
            }
            catch (error) {
                if (error.message === 'Token not found') {
                    res.status(404).json({ error: error.message });
                }
                else {
                    res.status(500).json({ error: 'Failed to unsubscribe: ' + error.message });
                }
            }
        });
    }
}
exports.default = new SubscriptionController();
