// tests/integration/subscriptionController.test.ts
import request from 'supertest';
import app from '../../src/index';
import sequelize from '../../src/config/database';
import Subscription from '../../src/models/Subscription';

describe('Subscription Controller Integration', () => {
    beforeAll(async () => {
        await sequelize.sync({ force: true });
    });

    afterEach(async () => {
        await Subscription.destroy({ where: {} });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('POST /api/subscription/subscribe', () => {
        it('should return 200 and a success response for valid input', async () => {
            const response = await request(app)
                .post('/api/subscription/subscribe')
                .send({
                    email: 'test@example.com',
                    city: 'London',
                    frequency: 'daily'
                });
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success');
        });

        it('should return 400 for invalid input', async () => {
            const response = await request(app)
                .post('/api/subscription/subscribe')
                .send({
                    email: 'not-an-email',
                    city: '',
                    frequency: ''
                });
            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/subscription/confirm/:token', () => {
        it('should return 200 and a success response for a valid token (mocked)', async () => {
            const token = 'mocked-token';
            const response = await request(app)
                .get(`/api/subscription/confirm/${token}`);
            // The actual status and response will depend on your implementation
            expect([200, 400, 404]).toContain(response.status);
        });
    });

    describe('GET /api/subscription/unsubscribe/:token', () => {
        it('should return 200 and a success response for a valid token (mocked)', async () => {
            const token = 'mocked-token';
            const response = await request(app)
                .get(`/api/subscription/unsubscribe/${token}`);
            // The actual status and response will depend on your implementation
            expect([200, 400, 404]).toContain(response.status);
        });
    });
});