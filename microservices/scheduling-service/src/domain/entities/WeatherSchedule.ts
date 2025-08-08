import { ScheduleFrequency, Location } from '../valueObjects/ScheduleValueObjects';
import { DomainEvent, WeatherUpdateEvent, ScheduleExecutedEvent } from '../events/WeatherEvents';

export class WeatherSchedule {
  private _domainEvents: DomainEvent[] = [];

  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _location: Location,
    private readonly _frequency: ScheduleFrequency,
    private _isActive: boolean = true,
    private _lastExecuted?: Date,
    private _nextExecution?: Date
  ) {
    this.calculateNextExecution();
  }

  static create(
    id: string,
    name: string,
    location: Location,
    frequency: ScheduleFrequency
  ): WeatherSchedule {
    return new WeatherSchedule(id, name, location, frequency);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get location(): Location {
    return this._location;
  }

  get frequency(): ScheduleFrequency {
    return this._frequency;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastExecuted(): Date | undefined {
    return this._lastExecuted;
  }

  get nextExecution(): Date | undefined {
    return this._nextExecution;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  activate(): void {
    this._isActive = true;
    this.calculateNextExecution();
  }

  deactivate(): void {
    this._isActive = false;
    this._nextExecution = undefined;
  }

  markAsExecuted(executedAt: Date, status: 'success' | 'failed', errorMessage?: string): void {
    this._lastExecuted = executedAt;
    
    const event: ScheduleExecutedEvent = {
      eventId: this.generateEventId(),
      eventType: 'ScheduleExecuted',
      occurredAt: new Date(),
      aggregateId: this._id,
      version: 1,
      payload: {
        scheduleId: this._id,
        executedAt,
        status,
        errorMessage
      }
    };

    this._domainEvents.push(event);
    
    if (status === 'success') {
      this.calculateNextExecution();
    }
  }

  publishWeatherUpdate(weatherData: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  }): void {
    const event: WeatherUpdateEvent = {
      eventId: this.generateEventId(),
      eventType: 'WeatherUpdate',
      occurredAt: new Date(),
      aggregateId: this._id,
      version: 1,
      payload: {
        location: this._location.city,
        temperature: weatherData.temperature,
        condition: weatherData.condition,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        timestamp: new Date()
      }
    };

    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  canExecuteNow(): boolean {
    if (!this._isActive) return false;
    if (!this._nextExecution) return false;
    return this._nextExecution <= new Date();
  }

  private calculateNextExecution(): void {
    if (!this._isActive) return;
    
    const now = new Date();
    
    if (this._frequency.cronExpression === '0 8 * * *') {
      const next = new Date(this._lastExecuted || now);
      next.setDate(next.getDate() + 1);
      next.setHours(8, 0, 0, 0);
      
      if (!this._lastExecuted && now.getHours() >= 8) {
        this._nextExecution = now;
      } else {
        this._nextExecution = next;
      }
    }
    
    if (this._frequency.cronExpression === '0 * * * *') {
      const next = new Date(this._lastExecuted || now);
      next.setHours(next.getHours() + 1, 0, 0, 0);
      this._nextExecution = next;
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
