import { Request, Response } from 'express';
import SubscriptionService from '../services/subscriptionService';

class SubscriptionController {
    async subscribe(req: Request, res: Response) {
        const { email, city, frequency } = req.body;

        if (!email || !city || !frequency) {
            return res.status(400).json({ error: 'email, city, and frequency are required' });
        }
        if (!['hourly', 'daily'].includes(frequency)) {
            return res.status(400).json({ error: 'Frequency must be hourly or daily' });
        }

        try {
            const result = await SubscriptionService.subscribe(email, city, frequency);
            res.status(200).json(result);
        } catch (error) {
            if ((error as Error).message === 'Email already subscribed') {
                res.status(409).json({ error: (error as Error).message });
            } else {
                res.status(500).json({ error: 'Failed to subscribe: ' + (error as Error).message });
            }
        }
    }

    async confirmSubscription(req: Request, res: Response) {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        try {
            const result = await SubscriptionService.confirmSubscription(token);
            res.status(200).json(result);
        } catch (error) {
            if ((error as Error).message === 'Token not found' || (error as Error).message === 'Already confirmed') {
                res.status(404).json({ error: (error as Error).message });
            } else {
                res.status(500).json({ error: 'Failed to confirm subscription: ' + (error as Error).message });
            }
        }
    }

    async unsubscribe(req: Request, res: Response) {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        try {
            const result = await SubscriptionService.unsubscribe(token);
            res.status(200).json(result);
        } catch (error) {
            if ((error as Error).message === 'Token not found') {
                res.status(404).json({ error: (error as Error).message });
            } else {
                res.status(500).json({ error: 'Failed to unsubscribe: ' + (error as Error).message });
            }
        }
    }
}

export default new SubscriptionController();