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

  public toNormalized(): string {
    return this.value.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  public equals(other: City): boolean {
    return this.toNormalized() === other.toNormalized();
  }

  public static fromString(city: string): City {
    return new City(city);
  }
}
