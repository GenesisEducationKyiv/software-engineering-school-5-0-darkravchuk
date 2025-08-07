export class ScheduleFrequency {
  private constructor(
    private readonly _cronExpression: string,
    private readonly _description: string
  ) {
    this.validateCronExpression(_cronExpression);
  }

  static daily(): ScheduleFrequency {
    return new ScheduleFrequency('0 8 * * *', 'Daily at 8:00 AM');
  }

  static hourly(): ScheduleFrequency {
    return new ScheduleFrequency('0 * * * *', 'Every hour');
  }

  static custom(cronExpression: string, description: string): ScheduleFrequency {
    return new ScheduleFrequency(cronExpression, description);
  }

  get cronExpression(): string {
    return this._cronExpression;
  }

  get description(): string {
    return this._description;
  }

  private validateCronExpression(expression: string): void {
    const cronRegex = /^(\*|[0-5]?\d|\*\/\d+)\s+(\*|[01]?\d|2[0-3]|\*\/\d+)\s+(\*|0?[1-9]|[12]\d|3[01]|\*\/\d+)\s+(\*|0?[1-9]|1[012]|\*\/\d+)\s+(\*|[0-6]|\*\/\d+)$/;
    if (!cronRegex.test(expression)) {
      throw new Error(`Invalid cron expression: ${expression}`);
    }
  }

  equals(other: ScheduleFrequency): boolean {
    return this._cronExpression === other._cronExpression;
  }
}

export class Location {
  private constructor(private readonly _city: string) {
    this.validateCity(_city);
  }

  static create(city: string): Location {
    return new Location(city);
  }

  get city(): string {
    return this._city;
  }

  private validateCity(city: string): void {
    if (!city || city.trim().length === 0) {
      throw new Error('City cannot be empty');
    }
    if (city.length > 100) {
      throw new Error('City name too long');
    }
  }

  equals(other: Location): boolean {
    return this._city.toLowerCase() === other._city.toLowerCase();
  }

  toString(): string {
    return this._city;
  }
}
