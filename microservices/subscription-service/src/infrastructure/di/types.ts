export const TYPES = {
  ISubscriptionRepository: Symbol.for('ISubscriptionRepository'),
  
  IEmailService: Symbol.for('IEmailService'),
  IWeatherService: Symbol.for('IWeatherService'),
  IEventPublisher: Symbol.for('IEventPublisher'),
  
  CreateSubscriptionUseCase: Symbol.for('CreateSubscriptionUseCase'),
  ConfirmSubscriptionUseCase: Symbol.for('ConfirmSubscriptionUseCase'),
  UnsubscribeUseCase: Symbol.for('UnsubscribeUseCase'),
  GetSubscriptionsUseCase: Symbol.for('GetSubscriptionsUseCase'),
  GetActiveSubscriptionsUseCase: Symbol.for('GetActiveSubscriptionsUseCase'),
  
  SubscriptionController: Symbol.for('SubscriptionController'),
};
