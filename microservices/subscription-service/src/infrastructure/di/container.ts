import { Container } from 'inversify';
import { TYPES } from './types';

// Domain Services
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';
import { IEmailService } from '../../domain/services/IEmailService';
import { IWeatherService } from '../../domain/services/IWeatherService';
import { IEventPublisher } from '../../domain/services/IEventPublisher';

// Infrastructure Implementations
import { SequelizeSubscriptionRepository } from '../repositories/SequelizeSubscriptionRepository';
import { HttpEmailService } from '../external/HttpEmailService';
import { HttpWeatherService } from '../external/HttpWeatherService';
import { RabbitMQEventPublisher } from '../messaging/RabbitMQEventPublisher';

// Use Cases
import { CreateSubscriptionUseCase } from '../../application/use-cases/CreateSubscriptionUseCase';
import { ConfirmSubscriptionUseCase } from '../../application/use-cases/ConfirmSubscriptionUseCase';
import { UnsubscribeUseCase } from '../../application/use-cases/UnsubscribeUseCase';
import { GetActiveSubscriptionsUseCase } from '../../application/use-cases/GetActiveSubscriptionsUseCase';

// Controllers
import { SubscriptionController } from '../../presentation/controllers/SubscriptionController';

const container = new Container();

// Configuration
const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

// Bind repositories
container.bind<ISubscriptionRepository>(TYPES.ISubscriptionRepository).to(SequelizeSubscriptionRepository).inSingletonScope();

// Bind domain services
container.bind<IEmailService>(TYPES.IEmailService).to(HttpEmailService).inSingletonScope();
container.bind<IWeatherService>(TYPES.IWeatherService).to(HttpWeatherService).inSingletonScope();
container.bind<IEventPublisher>(TYPES.IEventPublisher).toDynamicValue(() => {
  const publisher = new RabbitMQEventPublisher(rabbitmqUrl);
  // Connect asynchronously - don't block container initialization
  publisher.connect().catch(err => {
    console.error('Failed to connect RabbitMQ event publisher:', err);
  });
  return publisher;
}).inSingletonScope();

// Bind use cases
container.bind<CreateSubscriptionUseCase>(TYPES.CreateSubscriptionUseCase).to(CreateSubscriptionUseCase);
container.bind<ConfirmSubscriptionUseCase>(TYPES.ConfirmSubscriptionUseCase).to(ConfirmSubscriptionUseCase);
container.bind<UnsubscribeUseCase>(TYPES.UnsubscribeUseCase).to(UnsubscribeUseCase);
container.bind<GetActiveSubscriptionsUseCase>(TYPES.GetActiveSubscriptionsUseCase).to(GetActiveSubscriptionsUseCase);

// Bind controllers
container.bind<SubscriptionController>(TYPES.SubscriptionController).to(SubscriptionController);

export { container };
