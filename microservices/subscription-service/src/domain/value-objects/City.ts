export class City {
  private readonly value: string;

  constructor(city: string) {
    if (!this.isValid(city)) {
      throw new Error(`Invalid city name: ${city}`);
    }
    this.value = city.trim();
  }

  private isValid(city: string): boolean {
    const trimmed = city.trim();
    return trimmed.length > 0 && 
           trimmed.length <= 100 && 
           /^[a-zA-Z\s\-'\.]+$/.test(trimmed);
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: City): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  public static fromString(city: string): City {
    return new City(city);
  }
}
