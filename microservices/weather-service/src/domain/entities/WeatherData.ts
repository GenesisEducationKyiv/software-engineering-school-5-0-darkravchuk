import { City } from '../value-objects/City';
import { Temperature } from '../value-objects/Temperature';
import { Coordinates } from '../value-objects/Coordinates';

export interface WeatherCondition {
  main: string;
  description: string;
  icon?: string;
}

export class WeatherData {
  private constructor(
    private readonly _city: City,
    private readonly _temperature: Temperature,
    private readonly _humidity: number,
    private readonly _pressure: number,
    private readonly _condition: WeatherCondition,
    private readonly _coordinates: Coordinates,
    private readonly _timestamp: Date,
    private readonly _windSpeed?: number,
    private readonly _windDirection?: number,
    private readonly _visibility?: number
  ) {}

  public static create(params: {
    city: City;
    temperature: Temperature;
    humidity: number;
    pressure: number;
    condition: WeatherCondition;
    coordinates: Coordinates;
    windSpeed?: number;
    windDirection?: number;
    visibility?: number;
  }): WeatherData {
    WeatherData.validateHumidity(params.humidity);
    WeatherData.validatePressure(params.pressure);
    WeatherData.validateCondition(params.condition);

    return new WeatherData(
      params.city,
      params.temperature,
      params.humidity,
      params.pressure,
      params.condition,
      params.coordinates,
      new Date(),
      params.windSpeed,
      params.windDirection,
      params.visibility
    );
  }

  public static fromExternalApi(params: {
    city: string;
    temperature: number;
    humidity: number;
    pressure: number;
    condition: WeatherCondition;
    coordinates: { lat: number; lon: number };
    windSpeed?: number;
    windDirection?: number;
    visibility?: number;
  }): WeatherData {
    return WeatherData.create({
      city: City.fromString(params.city),
      temperature: Temperature.fromCelsius(params.temperature),
      humidity: params.humidity,
      pressure: params.pressure,
      condition: params.condition,
      coordinates: new Coordinates(params.coordinates.lat, params.coordinates.lon),
      windSpeed: params.windSpeed,
      windDirection: params.windDirection,
      visibility: params.visibility
    });
  }

  private static validateHumidity(humidity: number): void {
    if (humidity < 0 || humidity > 100) {
      throw new Error(`Invalid humidity: ${humidity}%. Must be between 0 and 100`);
    }
  }

  private static validatePressure(pressure: number): void {
    if (pressure < 800 || pressure > 1200) {
      throw new Error(`Invalid pressure: ${pressure} hPa. Must be between 800 and 1200`);
    }
  }

  private static validateCondition(condition: WeatherCondition): void {
    if (!condition.main || !condition.description) {
      throw new Error('Weather condition must have main and description');
    }
  }

  public isStale(maxAgeMinutes: number = 30): boolean {
    const ageMinutes = (Date.now() - this._timestamp.getTime()) / (1000 * 60);
    return ageMinutes > maxAgeMinutes;
  }

  public isSevereWeather(): boolean {
    const severeConditions = ['thunderstorm', 'tornado', 'hurricane', 'blizzard'];
    return severeConditions.some(condition => 
      this._condition.main.toLowerCase().includes(condition)
    );
  }

  public isExtremeTemperature(): boolean {
    const celsius = this._temperature.getCelsius();
    return celsius < -20 || celsius > 40;
  }

  public getComfortIndex(): 'comfortable' | 'uncomfortable' | 'extreme' {
    const temp = this._temperature.getCelsius();
    const humidity = this._humidity;

    if (temp >= 18 && temp <= 24 && humidity >= 40 && humidity <= 60) {
      return 'comfortable';
    }
    
    if (temp < 0 || temp > 35 || humidity > 80) {
      return 'extreme';
    }

    return 'uncomfortable';
  }

  public get city(): City {
    return this._city;
  }

  public get temperature(): Temperature {
    return this._temperature;
  }

  public get humidity(): number {
    return this._humidity;
  }

  public get pressure(): number {
    return this._pressure;
  }

  public get condition(): WeatherCondition {
    return { ...this._condition }; // Return copy to maintain immutability
  }

  public get coordinates(): Coordinates {
    return this._coordinates;
  }

  public get timestamp(): Date {
    return new Date(this._timestamp);
  }

  public get windSpeed(): number | undefined {
    return this._windSpeed;
  }

  public get windDirection(): number | undefined {
    return this._windDirection;
  }

  public get visibility(): number | undefined {
    return this._visibility;
  }

  public toApiResponse(): object {
    return {
      city: this._city.toString(),
      temperature: this._temperature.getCelsius(),
      temperatureF: this._temperature.getFahrenheit(),
      humidity: this._humidity,
      pressure: this._pressure,
      condition: this._condition,
      coordinates: {
        latitude: this._coordinates.getLatitude(),
        longitude: this._coordinates.getLongitude()
      },
      timestamp: this._timestamp.toISOString(),
      windSpeed: this._windSpeed,
      windDirection: this._windDirection,
      visibility: this._visibility,
      metadata: {
        isStale: this.isStale(),
        isSevereWeather: this.isSevereWeather(),
        isExtremeTemperature: this.isExtremeTemperature(),
        comfortIndex: this.getComfortIndex()
      }
    };
  }
}
