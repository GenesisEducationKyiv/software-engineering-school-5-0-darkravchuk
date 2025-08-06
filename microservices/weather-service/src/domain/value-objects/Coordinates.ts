export class Coordinates {
  private readonly latitude: number;
  private readonly longitude: number;

  constructor(latitude: number, longitude: number) {
    if (!this.isValidLatitude(latitude)) {
      throw new Error(`Invalid latitude: ${latitude}. Must be between -90 and 90`);
    }
    if (!this.isValidLongitude(longitude)) {
      throw new Error(`Invalid longitude: ${longitude}. Must be between -180 and 180`);
    }

    this.latitude = latitude;
    this.longitude = longitude;
  }

  private isValidLatitude(lat: number): boolean {
    return !isNaN(lat) && lat >= -90 && lat <= 90;
  }

  private isValidLongitude(lng: number): boolean {
    return !isNaN(lng) && lng >= -180 && lng <= 180;
  }

  public getLatitude(): number {
    return this.latitude;
  }

  public getLongitude(): number {
    return this.longitude;
  }

  public toString(): string {
    return `${this.latitude},${this.longitude}`;
  }

  public equals(other: Coordinates): boolean {
    return Math.abs(this.latitude - other.latitude) < 0.0001 &&
           Math.abs(this.longitude - other.longitude) < 0.0001;
  }

  public static fromString(coordString: string): Coordinates {
    const parts = coordString.split(',');
    if (parts.length !== 2) {
      throw new Error('Invalid coordinate string format. Expected: "lat,lng"');
    }

    const lat = parseFloat(parts[0].trim());
    const lng = parseFloat(parts[1].trim());

    return new Coordinates(lat, lng);
  }
}
