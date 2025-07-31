import { v4 as uuidv4 } from 'uuid';
import SubscriptionService from '../../src/services/subscriptionService';
import { IEmailSender } from '../../src/interfaces/IEmailSender';
import { ISubscriptionSubject } from '../../src/interfaces/ISubscriptionSubject';
import EmailObserver from '../../src/utils/emailObserver';
import { NotFoundError, ConflictError, WeatherUpdateError } from '../../src/errors/httpError';
import {MockSubscriptionRepository} from '../mocks/MockSubscriptionRepository';
import {SubscriptionCreateData} from '../../src/interfaces/ISubscriptionRepository';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));
jest.mock('../../src/utils/emailObserver');

describe('SubscriptionService Unit Tests', () => {
  let subscriptionService: SubscriptionService;
  let mockRepository: MockSubscriptionRepository;
  let mockEmailSender: jest.Mocked<IEmailSender>;
  let mockSubscriptionSubject: jest.Mocked<ISubscriptionSubject>;
  let mockEmailObserver: jest.Mocked<EmailObserver>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = new MockSubscriptionRepository();

    mockEmailSender = {
      sendConfirmationEmail: jest.fn().mockResolvedValue(undefined),
      sendUnsubscribeEmail: jest.fn().mockResolvedValue(undefined),
      sendWeatherUpdateEmail: jest.fn().mockResolvedValue(undefined),
    };

    mockSubscriptionSubject = {
      registerObserver: jest.fn().mockResolvedValue(undefined),
      removeObserver: jest.fn().mockResolvedValue(undefined),
      notifyObservers: jest.fn().mockResolvedValue(undefined),
    };

    mockEmailObserver = {
      update: jest.fn(),
      email: 'test@example.com',
      unsubscribeToken: 'unsub-token',
    } as any;
    (EmailObserver as jest.Mock).mockImplementation(() => mockEmailObserver);

    subscriptionService = new SubscriptionService(mockRepository, mockEmailSender, mockSubscriptionSubject);
  });

  describe('subscribe', () => {
    it('should throw ConflictError if email is already subscribed', async () => {
      // Arrange
      const email = 'test@example.com';
      const subscriptionData: SubscriptionCreateData = {
        email,
        city: 'Kyiv',
        frequency: 'daily',
        confirmationToken: 'token',
        unsubscribeToken: 'unsub',
        confirmed: false,
      };
      await mockRepository.create(subscriptionData);

      // Act & Assert
      await expect(subscriptionService.subscribe(email, 'Kyiv', 'daily')).rejects.toThrow(
        new ConflictError('Email already subscribed')
      );
      expect(mockEmailSender.sendConfirmationEmail).not.toHaveBeenCalled();
    });
  });

  describe('confirmSubscription', () => {
    it('should confirm subscription and register observer', async () => {
      // Arrange
      const confirmationToken = 'confirm-token';
      const subscriptionData: SubscriptionCreateData = {
        email: 'test@example.com',
        city: 'Kyiv',
        frequency: 'daily',
        confirmationToken,
        unsubscribeToken: 'unsub-token',
        confirmed: false,
      };
      await mockRepository.create(subscriptionData);

      // Act
      const result = await subscriptionService.confirmSubscription(confirmationToken);

      // Assert
      const updatedSubscription = await mockRepository.findByConfirmationToken(confirmationToken);
      expect(updatedSubscription?.confirmed).toBe(true);
      expect(EmailObserver).toHaveBeenCalledWith('test@example.com', 'unsub-token', mockEmailSender);
      expect(mockSubscriptionSubject.registerObserver).toHaveBeenCalledWith(
        mockEmailObserver,
        subscriptionData.city,
        subscriptionData.frequency
      );
      expect(result).toEqual({ message: 'Subscription confirmed successfully' });
    });

    it('should throw NotFoundError if confirmation token is not found', async () => {
      // Arrange
      const confirmationToken = 'invalid-token';

      // Act & Assert
      await expect(subscriptionService.confirmSubscription(confirmationToken)).rejects.toThrow(
        new NotFoundError('Token not found')
      );
      expect(mockSubscriptionSubject.registerObserver).not.toHaveBeenCalled();
    });

    it('should throw ConflictError if subscription is already confirmed', async () => {
      // Arrange
      const confirmationToken = 'confirm-token';
      const subscriptionData: SubscriptionCreateData = {
        email: 'test@example.com',
        city: 'Kyiv',
        frequency: 'daily',
        confirmationToken,
        unsubscribeToken: 'unsub-token',
        confirmed: true,
      };
      await mockRepository.create(subscriptionData);

      // Act & Assert
      await expect(subscriptionService.confirmSubscription(confirmationToken)).rejects.toThrow(
        new ConflictError('Already confirmed')
      );
      expect(mockSubscriptionSubject.registerObserver).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe and remove observer', async () => {
      // Arrange
      const unsubscribeToken = 'unsub-token';
      const subscriptionData: SubscriptionCreateData = {
        email: 'test@example.com',
        city: 'Kyiv',
        unsubscribeToken,
        confirmed: true,
        frequency: 'daily',
        confirmationToken: 'confirm-token',
      };
      await mockRepository.create(subscriptionData);

      // Act
      const result = await subscriptionService.unsubscribe(unsubscribeToken);

      // Assert
      expect(await mockRepository.findByUnsubscribeToken(unsubscribeToken)).toBeNull();
      expect(EmailObserver).toHaveBeenCalledWith(subscriptionData.email, unsubscribeToken, mockEmailSender);
      expect(mockSubscriptionSubject.removeObserver).toHaveBeenCalledWith(mockEmailObserver, subscriptionData.city);
      expect(mockEmailSender.sendUnsubscribeEmail).toHaveBeenCalledWith(subscriptionData.email, unsubscribeToken);
      expect(result).toEqual({ message: 'Unsubscribed successfully' });
    });

    it('should throw NotFoundError if unsubscribe token is not found', async () => {
      // Arrange
      const unsubscribeToken = 'invalid-token';

      // Act & Assert
      await expect(subscriptionService.unsubscribe(unsubscribeToken)).rejects.toThrow(
        new NotFoundError('Token not found')
      );
      expect(mockSubscriptionSubject.removeObserver).not.toHaveBeenCalled();
      expect(mockEmailSender.sendUnsubscribeEmail).not.toHaveBeenCalled();
    });
  });

  describe('sendWeatherUpdates', () => {
    it('should notify observers for each unique city with subscriptions', async () => {
      // Arrange
      const frequency = 'daily' as const;
      const subscriptions: SubscriptionCreateData[] = [
        {
          email: 'test1@example.com',
          city: 'Kyiv',
          frequency: 'daily',
          confirmed: true,
          confirmationToken: 'token1',
          unsubscribeToken: 'unsub1',
        },
        {
          email: 'test2@example.com',
          city: 'Kyiv',
          frequency: 'daily',
          confirmed: true,
          confirmationToken: 'token2',
          unsubscribeToken: 'unsub2',
        },
        {
          email: 'test3@example.com',
          city: 'Lviv',
          frequency: 'daily',
          confirmed: true,
          confirmationToken: 'token3',
          unsubscribeToken: 'unsub3',
        },
      ];
      await mockRepository.create(subscriptions[0]);
      await mockRepository.create(subscriptions[1]);
      await mockRepository.create(subscriptions[2]);

      // Act
      await subscriptionService.sendWeatherUpdates(frequency);

      // Assert
      expect(mockSubscriptionSubject.notifyObservers).toHaveBeenCalledTimes(2);
      expect(mockSubscriptionSubject.notifyObservers).toHaveBeenCalledWith('Kyiv', frequency);
      expect(mockSubscriptionSubject.notifyObservers).toHaveBeenCalledWith('Lviv', frequency);
    });

    it('should do nothing if no subscriptions exist for the frequency', async () => {
      // Arrange
      const frequency = 'daily' as const;

      // Act
      await subscriptionService.sendWeatherUpdates(frequency);

      // Assert
      expect(mockSubscriptionSubject.notifyObservers).not.toHaveBeenCalled();
    });

    it('should throw WeatherUpdateError if notifyObservers fails', async () => {
      // Arrange
      const frequency = 'daily' as const;
      const subscriptionData: SubscriptionCreateData = {
        email: 'test@example.com',
        city: 'Kyiv',
        frequency: 'daily',
        confirmed: true,
        confirmationToken: 'token',
        unsubscribeToken: 'unsub',
      };
      await mockRepository.create(subscriptionData);
      const error = new Error('Notification error');
      mockSubscriptionSubject.notifyObservers.mockRejectedValue(error);

      // Act & Assert
      await expect(subscriptionService.sendWeatherUpdates(frequency)).rejects.toThrow(
        new WeatherUpdateError(`Failed to send weather updates for ${frequency}`, {
          error: error.message,
          stack: error.stack,
        })
      );
    });
  });
});