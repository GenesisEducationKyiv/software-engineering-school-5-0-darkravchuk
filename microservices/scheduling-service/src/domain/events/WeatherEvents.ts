export interface DomainEvent {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  aggregateId: string;
  version: number;
}

export interface WeatherUpdateEvent extends DomainEvent {
  eventType: 'WeatherUpdate';
  payload: {
    location: string;
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    timestamp: Date;
  };
}

export interface ScheduleExecutedEvent extends DomainEvent {
  eventType: 'ScheduleExecuted';
  payload: {
    scheduleId: string;
    executedAt: Date;
    status: 'success' | 'failed';
    errorMessage?: string;
  };
}
