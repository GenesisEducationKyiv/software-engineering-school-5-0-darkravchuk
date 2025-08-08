import { ScheduleService } from '../application/services/ScheduleService';
import { ScheduleController } from '../presentation/controllers/ScheduleController';
import { ExpressApp } from '../presentation/app/ExpressApp';
import { CronScheduler } from '../infrastructure/scheduling/CronScheduler';
import { InMemoryScheduleRepository } from '../infrastructure/repositories/InMemoryScheduleRepository';
import { WeatherApiService } from '../infrastructure/external/WeatherApiService';
import { RabbitMQEventPublisher } from '../infrastructure/messaging/RabbitMQEventPublisher';
import { IScheduleRepository, IEventPublisher, IWeatherService } from '../domain/interfaces/DomainInterfaces';

export class DependencyContainer {
  private _scheduleRepository: IScheduleRepository;
  private _eventPublisher: IEventPublisher;
  private _weatherService: IWeatherService;
  private _scheduleService: ScheduleService;
  private _scheduleController: ScheduleController;
  private _expressApp: ExpressApp;
  private _cronScheduler: CronScheduler;

  constructor(
    private readonly config: {
      weatherServiceUrl: string;
      rabbitMqUrl: string;
    }
  ) {
    this.initializeDependencies();
  }

  private initializeDependencies(): void {
    this._scheduleRepository = new InMemoryScheduleRepository();
    this._eventPublisher = new RabbitMQEventPublisher(this.config.rabbitMqUrl);
    this._weatherService = new WeatherApiService(this.config.weatherServiceUrl);

    this._scheduleService = new ScheduleService(
      this._scheduleRepository,
      this._eventPublisher,
      this._weatherService
    );

    this._scheduleController = new ScheduleController(this._scheduleService);
    this._expressApp = new ExpressApp(this._scheduleController);

    this._cronScheduler = new CronScheduler(this._scheduleService);
  }

  get scheduleRepository(): IScheduleRepository {
    return this._scheduleRepository;
  }

  get eventPublisher(): IEventPublisher {
    return this._eventPublisher;
  }

  get weatherService(): IWeatherService {
    return this._weatherService;
  }

  get scheduleService(): ScheduleService {
    return this._scheduleService;
  }

  get scheduleController(): ScheduleController {
    return this._scheduleController;
  }

  get expressApp(): ExpressApp {
    return this._expressApp;
  }

  get cronScheduler(): CronScheduler {
    return this._cronScheduler;
  }

  async initialize(): Promise<void> {
    console.log('🔧 Initializing Scheduling Service dependencies...');
    
    try {
      if (this._eventPublisher instanceof RabbitMQEventPublisher) {
        await this._eventPublisher.connect();
        console.log('RabbitMQ connection established');
      }

      console.log('All dependencies initialized successfully');
    } catch (error) {
      console.error('Failed to initialize dependencies:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Scheduling Service resources...');
    
    try {
      this._cronScheduler.stop();
      
      if (this._eventPublisher instanceof RabbitMQEventPublisher) {
        await this._eventPublisher.disconnect();
      }

      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}
