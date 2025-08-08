import { EmailSender } from '../../src/utils/EmailSender';
import { IEmailProvider } from '../../src/interfaces/IEmailProvider';
import * as emailBuilder from '../../src/utils/emailBuilder';
import { EmailContent } from '../../src/utils/emailBuilder';

jest.mock('../../src/interfaces/IEmailProvider');
jest.mock('../../src/utils/emailBuilder');

describe('EmailSender Unit Tests', () => {
  let emailSender: EmailSender;
  let mockEmailProvider: jest.Mocked<IEmailProvider>;
  let mockBuildConfirmationEmail: jest.SpyInstance;
  let mockBuildWeatherUpdateEmail: jest.SpyInstance;
  let mockBuildUnsubscribeEmail: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEmailProvider = {
      configure: jest.fn(),
      send: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<IEmailProvider>;

    mockBuildConfirmationEmail = jest
      .spyOn(emailBuilder, 'buildConfirmationEmail')
      .mockReturnValue({
        to: 'test@example.com',
        from: 'no-reply@example.com',
        subject: 'Confirm Your Subscription',
        text: 'Confirm your subscription',
        html: '<p>Confirm your subscription</p>',
      } as EmailContent);
    mockBuildWeatherUpdateEmail = jest
      .spyOn(emailBuilder, 'buildWeatherUpdateEmail')
      .mockReturnValue({
        to: 'test@example.com',
        from: 'no-reply@example.com',
        subject: 'Weather Update',
        text: 'Weather update',
        html: '<p>Weather update</p>',
      } as EmailContent);
    mockBuildUnsubscribeEmail = jest
      .spyOn(emailBuilder, 'buildUnsubscribeEmail')
      .mockReturnValue({
        to: 'test@example.com',
        from: 'no-reply@example.com',
        subject: 'Unsubscribe Confirmation',
        text: 'Unsubscribed',
        html: '<p>Unsubscribed</p>',
      } as EmailContent);

    process.env.SENDGRID_API_KEY = 'test-sendgrid-api-key';

    emailSender = new EmailSender(mockEmailProvider);
  });


  describe('constructor', () => {
    it('should configure the email provider with the API key', () => {
      // Assert
      expect(mockEmailProvider.configure).toHaveBeenCalledWith({
        apiKey: 'test-sendgrid-api-key',
      });
    });

    it('should configure the email provider with an empty string if API key is not set', () => {
      // Arrange
      delete process.env.SENDGRID_API_KEY;
      const newEmailSender = new EmailSender(mockEmailProvider);

      // Assert
      expect(mockEmailProvider.configure).toHaveBeenCalledWith({
        apiKey: '',
      });
    });
  });

  describe('sendConfirmationEmail', () => {
    it('should send a confirmation email', async () => {
      // Arrange
      const to = 'test@example.com';
      const confirmationToken = 'confirm-token';
      const emailContent: EmailContent = {
        to,
        from: 'no-reply@example.com',
        subject: 'Confirm Your Subscription',
        text: `Click to confirm: ${confirmationToken}`,
        html: `<p>Click to confirm: ${confirmationToken}</p>`,
      };
      mockBuildConfirmationEmail.mockReturnValue(emailContent);

      // Act
      await emailSender.sendConfirmationEmail(to, confirmationToken);

      // Assert
      expect(mockBuildConfirmationEmail).toHaveBeenCalledWith(to, confirmationToken);
      expect(mockEmailProvider.send).toHaveBeenCalledWith(emailContent);
    });

    it('should propagate errors from the email provider', async () => {
      // Arrange
      const to = 'test@example.com';
      const confirmationToken = 'confirm-token';
      const error = new Error('SendGrid API error');
      mockEmailProvider.send.mockRejectedValue(error);

      // Act & Assert
      await expect(emailSender.sendConfirmationEmail(to, confirmationToken)).rejects.toThrow('SendGrid API error');
      expect(mockBuildConfirmationEmail).toHaveBeenCalledWith(to, confirmationToken);
      expect(mockEmailProvider.send).toHaveBeenCalled();
    });
  });

  describe('sendWeatherUpdateEmail', () => {
    it('should build and send a weather update email', async () => {
      // Arrange
      const to = 'test@example.com';
      const city = 'Kyiv';
      const unsubscribeToken = 'unsub-token';
      const weather = {
        temperature: 20,
        description: 'Sunny',
        humidity: 60,
        pressure: 1013,
      };
      const emailContent: EmailContent = {
        to,
        from: 'no-reply@example.com',
        subject: 'Weather Update for Kyiv',
        text: `Weather in ${city}: ${weather.description}`,
        html: `<p>Weather in ${city}: ${weather.description}</p>`,
      };
      mockBuildWeatherUpdateEmail.mockReturnValue(emailContent);

      // Act
      await emailSender.sendWeatherUpdateEmail(to, city, unsubscribeToken, weather);

      // Assert
      expect(mockBuildWeatherUpdateEmail).toHaveBeenCalledWith(to, city, unsubscribeToken, weather);
      expect(mockEmailProvider.send).toHaveBeenCalledWith(emailContent);
    });

    it('should propagate errors from the email provider', async () => {
      // Arrange
      const to = 'test@example.com';
      const city = 'Kyiv';
      const unsubscribeToken = 'unsub-token';
      const weather = {
        temperature: 20,
        description: 'Sunny',
        humidity: 60,
        pressure: 1013,
      };
      const error = new Error('SendGrid API error');
      mockEmailProvider.send.mockRejectedValue(error);

      // Act & Assert
      await expect(
        emailSender.sendWeatherUpdateEmail(to, city, unsubscribeToken, weather)
      ).rejects.toThrow('SendGrid API error');
      expect(mockBuildWeatherUpdateEmail).toHaveBeenCalledWith(to, city, unsubscribeToken, weather);
      expect(mockEmailProvider.send).toHaveBeenCalled();
    });
  });

  describe('sendUnsubscribeEmail', () => {
    it('should build and send an unsubscribe email', async () => {
      // Arrange
      const to = 'test@example.com';
      const unsubscribeToken = 'unsub-token';
      const emailContent: EmailContent = {
        to,
        from: 'no-reply@example.com',
        subject: 'Unsubscribe Confirmation',
        text: `You have unsubscribed: ${unsubscribeToken}`,
        html: `<p>You have unsubscribed: ${unsubscribeToken}</p>`,
      };
      mockBuildUnsubscribeEmail.mockReturnValue(emailContent);

      // Act
      await emailSender.sendUnsubscribeEmail(to, unsubscribeToken);

      // Assert
      expect(mockBuildUnsubscribeEmail).toHaveBeenCalledWith(to, unsubscribeToken);
      expect(mockEmailProvider.send).toHaveBeenCalledWith(emailContent);
    });

    it('should propagate errors from the email provider', async () => {
      // Arrange
      const to = 'test@example.com';
      const unsubscribeToken = 'unsub-token';
      const error = new Error('SendGrid API error');
      mockEmailProvider.send.mockRejectedValue(error);

      // Act & Assert
      await expect(emailSender.sendUnsubscribeEmail(to, unsubscribeToken)).rejects.toThrow('SendGrid API error');
      expect(mockBuildUnsubscribeEmail).toHaveBeenCalledWith(to, unsubscribeToken);
      expect(mockEmailProvider.send).toHaveBeenCalled();
    });
  });
});