import { WeatherSchedule } from '../../domain/entities/WeatherSchedule';
import { Location, ScheduleFrequency } from '../../domain/valueObjects/ScheduleValueObjects';
import { IScheduleRepository } from '../../domain/interfaces/DomainInterfaces';

export class InMemoryScheduleRepository implements IScheduleRepository {
  private schedules = new Map<string, WeatherSchedule>();

  async findById(id: string): Promise<WeatherSchedule | null> {
    const schedule = this.schedules.get(id);
    return schedule ? this.cloneSchedule(schedule) : null;
  }

  async findAll(): Promise<WeatherSchedule[]> {
    return Array.from(this.schedules.values()).map(schedule => this.cloneSchedule(schedule));
  }

  async findActiveSchedules(): Promise<WeatherSchedule[]> {
    const schedules = Array.from(this.schedules.values());
    return schedules
      .filter(schedule => schedule.isActive)
      .map(schedule => this.cloneSchedule(schedule));
  }

  async save(schedule: WeatherSchedule): Promise<void> {
    this.schedules.set(schedule.id, this.cloneSchedule(schedule));
  }

  async delete(id: string): Promise<void> {
    this.schedules.delete(id);
  }

  private cloneSchedule(original: WeatherSchedule): WeatherSchedule {
    const location = Location.create(original.location.city);
    let frequency: ScheduleFrequency;

    if (original.frequency.cronExpression === '0 8 * * *') {
      frequency = ScheduleFrequency.daily();
    } else if (original.frequency.cronExpression === '0 * * * *') {
      frequency = ScheduleFrequency.hourly();
    } else {
      frequency = ScheduleFrequency.custom(
        original.frequency.cronExpression,
        original.frequency.description
      );
    }

    const cloned = new WeatherSchedule(
      original.id,
      original.name,
      location,
      frequency,
      original.isActive,
      original.lastExecuted,
      original.nextExecution
    );

    return cloned;
  }

  getAllSchedulesDebug(): WeatherSchedule[] {
    return Array.from(this.schedules.values());
  }
}
