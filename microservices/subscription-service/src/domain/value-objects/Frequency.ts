export type FrequencyType = 'hourly' | 'daily';

export class Frequency {
  private readonly value: FrequencyType;

  constructor(frequency: FrequencyType) {
    if (!this.isValid(frequency)) {
      throw new Error(`Invalid frequency: ${frequency}. Must be 'hourly' or 'daily'`);
    }
    this.value = frequency;
  }

  private isValid(frequency: string): frequency is FrequencyType {
    return frequency === 'hourly' || frequency === 'daily';
  }

  public toString(): FrequencyType {
    return this.value;
  }

  public equals(other: Frequency): boolean {
    return this.value === other.value;
  }

  public isHourly(): boolean {
    return this.value === 'hourly';
  }

  public isDaily(): boolean {
    return this.value === 'daily';
  }

  public static hourly(): Frequency {
    return new Frequency('hourly');
  }

  public static daily(): Frequency {
    return new Frequency('daily');
  }

  public static fromString(frequency: string): Frequency {
    return new Frequency(frequency as FrequencyType);
  }
}
