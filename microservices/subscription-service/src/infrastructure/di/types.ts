export const TYPES = {
  // Repositories
  ISubscriptionRepository: Symbol.for('ISubscriptionRepository'),
  
  // Domain Services
  IEmailService: Symbol.for('IEmailService'),
  IWeatherService: Symbol.for('IWeatherService'),
  IEventPublisher: Symbol.for('IEventPublisher'),
  
  // Use Cases
  CreateSubscriptionUseCase: Symbol.for('CreateSubscriptionUseCase'),
  ConfirmSubscriptionUseCase: Symbol.for('ConfirmSubscriptionUseCase'),
  UnsubscribeUseCase: Symbol.for('UnsubscribeUseCase'),
  GetSubscriptionsUseCase: Symbol.for('GetSubscriptionsUseCase'),
  GetActiveSubscriptionsUseCase: Symbol.for('GetActiveSubscriptionsUseCase'),
  
  // Controllers
  SubscriptionController: Symbol.for('SubscriptionController'),
};
