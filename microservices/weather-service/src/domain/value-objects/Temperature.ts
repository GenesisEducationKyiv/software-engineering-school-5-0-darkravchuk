export class Temperature {
  private readonly celsius: number;

  constructor(celsius: number, unit: 'celsius' | 'fahrenheit' = 'celsius') {
    if (unit === 'fahrenheit') {
      this.celsius = this.fahrenheitToCelsius(celsius);
    } else {
      this.celsius = celsius;
    }

    if (!this.isValid(this.celsius)) {
      throw new Error(`Invalid temperature: ${celsius}°${unit === 'celsius' ? 'C' : 'F'}`);
    }
  }

  private isValid(celsius: number): boolean {
    return celsius >= -100 && celsius <= 60 && !isNaN(celsius);
  }

  private fahrenheitToCelsius(fahrenheit: number): number {
    return (fahrenheit - 32) * 5 / 9;
  }

  private celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9 / 5) + 32;
  }

  public getCelsius(): number {
    return Math.round(this.celsius * 10) / 10; // Round to 1 decimal
  }

  public getFahrenheit(): number {
    return Math.round(this.celsiusToFahrenheit(this.celsius) * 10) / 10;
  }

  public toString(unit: 'celsius' | 'fahrenheit' = 'celsius'): string {
    if (unit === 'fahrenheit') {
      return `${this.getFahrenheit()}°F`;
    }
    return `${this.getCelsius()}°C`;
  }

  public static fromCelsius(celsius: number): Temperature {
    return new Temperature(celsius, 'celsius');
  }

  public static fromFahrenheit(fahrenheit: number): Temperature {
    return new Temperature(fahrenheit, 'fahrenheit');
  }
}
