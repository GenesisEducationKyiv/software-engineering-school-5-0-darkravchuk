import { WeatherSchedule } from '../../domain/entities/WeatherSchedule';
import { Location, ScheduleFrequency } from '../../domain/valueObjects/ScheduleValueObjects';
import { IScheduleRepository, IEventPublisher, IWeatherService } from '../../domain/interfaces/DomainInterfaces';
import { CreateScheduleDto, ScheduleDto, ExecuteScheduleResult } from '../dtos/ScheduleDtos';

export class ScheduleService {
  constructor(
    private readonly scheduleRepository: IScheduleRepository,
    private readonly eventPublisher: IEventPublisher,
    private readonly weatherService: IWeatherService
  ) {}

  async createSchedule(dto: CreateScheduleDto): Promise<ScheduleDto> {
    const location = Location.create(dto.location);
    
    let frequency: ScheduleFrequency;
    switch (dto.frequency) {
      case 'daily':
        frequency = ScheduleFrequency.daily();
        break;
      case 'hourly':
        frequency = ScheduleFrequency.hourly();
        break;
      case 'custom':
        if (!dto.cronExpression || !dto.cronDescription) {
          throw new Error('Custom frequency requires cron expression and description');
        }
        frequency = ScheduleFrequency.custom(dto.cronExpression, dto.cronDescription);
        break;
      default:
        throw new Error(`Unsupported frequency: ${dto.frequency}`);
    }

    const scheduleId = this.generateId();
    const schedule = WeatherSchedule.create(scheduleId, dto.name, location, frequency);

    await this.scheduleRepository.save(schedule);

    const events = schedule.domainEvents;
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
    schedule.clearDomainEvents();

    return this.mapToDto(schedule);
  }

  async getAllSchedules(): Promise<ScheduleDto[]> {
    const schedules = await this.scheduleRepository.findAll();
    return schedules.map(schedule => this.mapToDto(schedule));
  }

  async getScheduleById(id: string): Promise<ScheduleDto | null> {
    const schedule = await this.scheduleRepository.findById(id);
    return schedule ? this.mapToDto(schedule) : null;
  }

  async activateSchedule(id: string): Promise<void> {
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new Error(`Schedule with id ${id} not found`);
    }

    schedule.activate();
    await this.scheduleRepository.save(schedule);

    const events = schedule.domainEvents;
    for (const event of events) {
      await this.eventPublisher.publish(event);
    }
    schedule.clearDomainEvents();
  }

  async deactivateSchedule(id: string): Promise<void> {
    const schedule = await this.scheduleRepository.findById(id);
    if (!schedule) {
      throw new Error(`Schedule with id ${id} not found`);
    }

    schedule.deactivate();
    await this.scheduleRepository.save(schedule);
  }

  async deleteSchedule(id: string): Promise<void> {
    await this.scheduleRepository.delete(id);
  }

  async executeSchedule(scheduleId: string): Promise<ExecuteScheduleResult> {
    const schedule = await this.scheduleRepository.findById(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule with id ${scheduleId} not found`);
    }

    if (!schedule.canExecuteNow()) {
      throw new Error(`Schedule ${scheduleId} cannot be executed now`);
    }

    try {
      const weatherData = await this.weatherService.getCurrentWeather(schedule.location.city);
      
      schedule.publishWeatherUpdate(weatherData);
      
      const executedAt = new Date();
      schedule.markAsExecuted(executedAt, 'success');

      await this.scheduleRepository.save(schedule);

      const events = schedule.domainEvents;
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      schedule.clearDomainEvents();

      return {
        scheduleId,
        status: 'success',
        executedAt,
        weatherData: {
          scheduleId,
          location: schedule.location.city,
          ...weatherData,
          timestamp: executedAt
        }
      };

    } catch (error) {
      const executedAt = new Date();
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      schedule.markAsExecuted(executedAt, 'failed', errorMessage);
      await this.scheduleRepository.save(schedule);

      const events = schedule.domainEvents;
      for (const event of events) {
        await this.eventPublisher.publish(event);
      }
      schedule.clearDomainEvents();

      return {
        scheduleId,
        status: 'failed',
        executedAt,
        errorMessage
      };
    }
  }

  async executeAllDueSchedules(): Promise<ExecuteScheduleResult[]> {
    const activeSchedules = await this.scheduleRepository.findActiveSchedules();
    const dueSchedules = activeSchedules.filter(schedule => schedule.canExecuteNow());

    const results: ExecuteScheduleResult[] = [];
    
    for (const schedule of dueSchedules) {
      try {
        const result = await this.executeSchedule(schedule.id);
        results.push(result);
      } catch (error) {
        results.push({
          scheduleId: schedule.id,
          status: 'failed',
          executedAt: new Date(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  private mapToDto(schedule: WeatherSchedule): ScheduleDto {
    return {
      id: schedule.id,
      name: schedule.name,
      location: schedule.location.city,
      frequency: schedule.frequency.description,
      isActive: schedule.isActive,
      lastExecuted: schedule.lastExecuted,
      nextExecution: schedule.nextExecution
    };
  }

  private generateId(): string {
    return `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
