import request from 'supertest';
import app from '../../src/index';
import sequelize from '../../src/config/database';
import Subscription from '../../src/models/Subscription';
import {WeatherApiComProvider} from '../../src/utils/weatherProviders/WeatherApiComProvider';
import {SendGridProvider} from '../../src/utils/emailProviders/SendGridProvider';

const mockedToken = 'mocked-uuid';
const invalidToken = 'invalid-token';

jest.mock('../../src/utils/weatherProviders/WeatherApiComProvider');
jest.mock('../../src/utils/emailProviders/SendGridProvider');
jest.mock('uuid', () => ({
  v4: jest.fn().mockImplementation(() => mockedToken),
}));

describe('Subscription Controller Integration', () => {
  beforeAll(async () => {
    (WeatherApiComProvider.prototype.configure as jest.Mock).mockImplementation(() => {
    });
    (WeatherApiComProvider.prototype.getWeather as jest.Mock).mockResolvedValue(
      {temperature: 20, description: 'Sunny', pressure: 1013, humidity: 60}
    );
    (SendGridProvider.prototype.configure as jest.Mock).mockImplementation(() => {
    });
    (SendGridProvider.prototype.send as jest.Mock).mockResolvedValue({});
  });

  afterEach(async () => {
    await Subscription.destroy({where: {}, truncate: true});
  });

  afterAll(async () => {
    await sequelize.close();
  });

  async function subscribe(email: string, city: string, frequency: string) {
    return request(app)
      .post('/api/subscription/subscribe')
      .send({
        email,
        city,
        frequency
      });
  }

  describe('POST /api/subscription/subscribe', () => {
    it('should return 200 and a success response for valid input', async () => {
      const response = await subscribe('test@example.com', 'London', 'daily');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Subscription created. Check your email for confirmation.');
    });

    it('should return 400 for invalid input', async () => {
      const response = await subscribe('not-an-email', '', '');
      expect(response.status).toBe(400);
    });
  });

  describe('subscribed user scenarios', () => {

    beforeEach(async () => {
      await subscribe('test@example.com', 'London', 'daily');
    });

    describe('GET /api/subscription/confirm/:token', () => {
      it('should return 200 and a success response for a valid token', async () => {

        const response = await request(app).get(`/api/subscription/confirm/${mockedToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Subscription confirmed successfully');
      });

      it('should return 404 and error message response for an invalid token', async () => {
        const response = await request(app).get(`/api/subscription/confirm/${invalidToken}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Token not found');
      });

      it('should return 409 and conflict message response for recurrent confirm request', async () => {
        await request(app).get(`/api/subscription/confirm/${mockedToken}`);
        const response = await request(app).get(`/api/subscription/confirm/${mockedToken}`);

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('error', 'Already confirmed');
      });
    });

    describe('GET /api/subscription/unsubscribe/:token', () => {
      it('should return 200 and a success response for a valid token', async () => {
        await request(app).get(`/api/subscription/confirm/${mockedToken}`);

        const response = await request(app).get(`/api/subscription/unsubscribe/${mockedToken}`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Unsubscribed successfully');
      });

      it('should return 404 and error message response for an invalid token', async () => {
        await request(app).get(`/api/subscription/confirm/${mockedToken}`);

        const response = await request(app).get(`/api/subscription/unsubscribe/${invalidToken}`);
        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Token not found');
      });

      it('should return 404 and not found error message response for recurrent confirm request', async () => {
        await request(app).get(`/api/subscription/confirm/${mockedToken}`);
        await request(app).get(`/api/subscription/unsubscribe/${mockedToken}`);
        const response = await request(app).get(`/api/subscription/unsubscribe/${mockedToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toHaveProperty('error', 'Token not found');
      });
    });
  });
});