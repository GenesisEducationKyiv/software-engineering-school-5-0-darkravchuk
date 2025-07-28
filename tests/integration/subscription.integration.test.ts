import request from 'supertest';
import app from '../../src/index';
import sequelize from '../../src/config/database';
import Subscription from '../../src/models/Subscription';
import { WeatherApiComProvider } from '../../src/utils/weatherProviders/WeatherApiComProvider';
import { WeatherDataDTO } from '../../src/services/WeatherDataDTO';
import { SendGridProvider } from '../../src/utils/emailProviders/SendGridProvider';

const token = 'mocked-uuid'

jest.mock('../../src/utils/weatherProviders/WeatherApiComProvider');
jest.mock('../../src/utils/emailProviders/SendGridProvider');
jest.mock('uuid', () => ({
    v4: jest.fn().mockImplementation(() => token),
}))

describe('Subscription Controller Integration', () => {
    beforeAll(async () => {
        (WeatherApiComProvider.prototype.configure as jest.Mock).mockImplementation(() => {});
        (WeatherApiComProvider.prototype.getWeather as jest.Mock).mockResolvedValue(
            new WeatherDataDTO(20, 'Sunny', 60, 1013)
        );
        (SendGridProvider.prototype.configure as jest.Mock).mockImplementation(() => {});
        (SendGridProvider.prototype.send as jest.Mock).mockResolvedValue({});
    });

    afterEach(async () => {
        await Subscription.destroy({ where: {}, truncate: true });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('POST /api/subscription/subscribe', () => {
        it('should return 200 and a success response for valid input', async () => {
            const response = await request(app)
                .post('/api/subscription/subscribe')
                .send({
                    email: 'hexh86260@gmail.com',
                    city: 'London',
                    frequency: 'daily',
                });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Subscription created. Check your email for confirmation.');
        });

        it('should return 400 for invalid input', async () => {
            const response = await request(app)
                .post('/api/subscription/subscribe')
                .send({
                    email: 'not-an-email',
                    city: '',
                    frequency: '',
                });
            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/subscription/confirm/:token', () => {
        it('should return 200 and a success response for a valid token', async () => {
            // const subscribeResponse = await request(app)
            //     .post('/api/subscription/subscribe')
            //     .send({
            //         email: 'test1@example.com',
            //         city: 'London',
            //         frequency: 'daily',
            //     });
            //
            // const subscription = await Subscription.findOne({ where: { email: 'test1@example.com' } });

            const response = await request(app).get(`/api/subscription/confirm/${token}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Subscription confirmed successfully');
        });
    });

    describe('GET /api/subscription/unsubscribe/:token', () => {
        it('should return 200 and a success response for a valid token', async () => {
            const subscribeResponse = await request(app)
                .post('/api/subscription/subscribe')
                .send({
                    email: 'test@example.com',
                    city: 'London',
                    frequency: 'daily',
                });
            const token = subscribeResponse.body.confirmationToken;

            await request(app).get(`/api/subscription/confirm/${token}`);

            const subscription = await Subscription.findOne({ where: { email: 'test@example.com' } });
            const unsubscribeToken = subscription?.unsubscribeToken;

            const response = await request(app).get(`/api/subscription/unsubscribe/${unsubscribeToken}`);
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Unsubscribed successfully');
        });
    });
});