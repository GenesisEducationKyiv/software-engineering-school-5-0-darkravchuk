import { Request, Response } from 'express';
import SubscriptionService from '../services/subscriptionService';
import { SubscriptionRequest, TokenRequest, SuccessResponse, ErrorResponse } from '../types/subscription';

class SubscriptionController {
    async subscribe(req: Request<{}, {}, SubscriptionRequest>, res: Response<SuccessResponse | ErrorResponse>) {
        const { email, city, frequency } = req.body;

        if (!email || !city || !frequency) {
            return res.status(400).json({ error: 'Email, city, and frequency are required' });
        }
        if (!['hourly', 'daily'].includes(frequency)) {
            return res.status(400).json({ error: 'Frequency must be hourly or daily' });
        }

        try {
            const result: SuccessResponse = await SubscriptionService.subscribe(email, city, frequency);
            return res.status(200).json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'Email already subscribed') {
                return res.status(409).json({ error: errorMessage });
            }
            return res.status(500).json({ error: `Failed to subscribe: ${errorMessage}` });
        }
    }

    async confirmSubscription(req: Request<TokenRequest>, res: Response<SuccessResponse | ErrorResponse>) {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        try {
            const result: SuccessResponse = await SubscriptionService.confirmSubscription(token);
            return res.status(200).json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'Token not found' || errorMessage === 'Already confirmed') {
                return res.status(404).json({ error: errorMessage });
            }
            return res.status(500).json({ error: `Failed to confirm subscription: ${errorMessage}` });
        }
    }

    async unsubscribe(req: Request<TokenRequest>, res: Response<SuccessResponse | ErrorResponse>) {
        const { token } = req.params;

        if (!token) {
            return res.status(400).json({ error: 'Token is required' });
        }

        try {
            const result: SuccessResponse = await SubscriptionService.unsubscribe(token);
            return res.status(200).json(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'Token not found') {
                return res.status(404).json({ error: errorMessage });
            }
            return res.status(500).json({ error: `Failed to unsubscribe: ${errorMessage}` });
        }
    }
}

export default new SubscriptionController();