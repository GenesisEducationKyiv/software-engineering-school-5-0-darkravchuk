export interface CreateScheduleDto {
  name: string;
  location: string;
  frequency: 'daily' | 'hourly' | 'custom';
  cronExpression?: string;
  cronDescription?: string;
}

export interface ScheduleDto {
  id: string;
  name: string;
  location: string;
  frequency: string;
  isActive: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
}

export interface WeatherUpdateDto {
  scheduleId: string;
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  timestamp: Date;
}

export interface ExecuteScheduleResult {
  scheduleId: string;
  status: 'success' | 'failed';
  executedAt: Date;
  errorMessage?: string;
  weatherData?: WeatherUpdateDto;
}
