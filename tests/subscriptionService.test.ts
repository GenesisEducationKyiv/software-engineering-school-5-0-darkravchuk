import SubscriptionService from '../src/services/subscriptionService';
import Subscription from '../src/models/Subscription';
import * as sendGrid from '../src/utils/sendGrid';
import SubscriptionSubject from '../src/utils/subscriptionSubject';
import EmailObserver from '../src/utils/emailObserver';

jest.mock('../src/models/Subscription');
jest.mock('../src/utils/sendGrid');
jest.mock('../src/utils/subscriptionSubject');
jest.mock('../src/utils/emailObserver');

const mockSubscription = {
    email: 'test@example.com',
    city: 'Kyiv',
    frequency: 'daily',
    confirmationToken: 'confirm-token',
    unsubscribeToken: 'unsubscribe-token',
    confirmed: false,
    save: jest.fn(),
    destroy: jest.fn(),
};

describe('SubscriptionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should subscribe a new user', async () => {
        (Subscription.findOne as jest.Mock).mockResolvedValue(null);
        (Subscription.create as jest.Mock).mockResolvedValue(mockSubscription);

        const result = await SubscriptionService.subscribe('test@example.com', 'Kyiv', 'daily');

        expect(Subscription.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
        expect(Subscription.create).toHaveBeenCalled();
        expect(sendGrid.sendConfirmationEmail).toHaveBeenCalledWith('test@example.com', expect.any(String));
        expect(result.message).toMatch(/Subscription created/i);
    });

    it('should not allow duplicate subscriptions', async () => {
        (Subscription.findOne as jest.Mock).mockResolvedValue(mockSubscription);

        await expect(SubscriptionService.subscribe('test@example.com', 'Kyiv', 'daily')).rejects.toThrow('Email already subscribed');
    });

    it('should confirm subscription with valid token', async () => {
        (Subscription.findOne as jest.Mock).mockResolvedValue({ ...mockSubscription, save: jest.fn(), confirmed: false });

        const result = await SubscriptionService.confirmSubscription('confirm-token');

        expect(Subscription.findOne).toHaveBeenCalledWith({ where: { confirmationToken: 'confirm-token' } });
        expect(result.message).toMatch(/confirmed successfully/i);
        expect(SubscriptionSubject.registerObserver).toHaveBeenCalled();
    });

    it('should unsubscribe with valid token', async () => {
        (Subscription.findOne as jest.Mock).mockResolvedValue(mockSubscription);

        const result = await SubscriptionService.unsubscribe('unsubscribe-token');

        expect(Subscription.findOne).toHaveBeenCalledWith({ where: { unsubscribeToken: 'unsubscribe-token' } });
        expect(SubscriptionSubject.removeObserver).toHaveBeenCalledWith(expect.any(EmailObserver), 'Kyiv');
        expect(mockSubscription.destroy).toHaveBeenCalled();
        expect(result.message).toMatch(/Unsubscribed successfully/i);
    });

    it('should notify all confirmed subscribers for a frequency', async () => {
        (Subscription.findAll as jest.Mock).mockResolvedValue([
            { ...mockSubscription, confirmed: true },
            { ...mockSubscription, confirmed: true, city: 'Lviv' }
        ]);

        await SubscriptionService.sendWeatherUpdates('daily');

        expect(Subscription.findAll).toHaveBeenCalledWith({ where: { confirmed: true, frequency: 'daily' } });
        expect(SubscriptionSubject.notifyObservers).toHaveBeenCalledWith('Kyiv', 'daily');
        expect(SubscriptionSubject.notifyObservers).toHaveBeenCalledWith('Lviv', 'daily');
    });
});
