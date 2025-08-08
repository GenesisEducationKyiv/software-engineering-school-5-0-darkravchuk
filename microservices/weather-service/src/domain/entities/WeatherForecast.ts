import { City } from '../value-objects/City';
import { Temperature } from '../value-objects/Temperature';
import { Coordinates } from '../value-objects/Coordinates';
import { WeatherData, WeatherCondition } from './WeatherData';

export interface ForecastPeriod {
  date: Date;
  temperature: {
    min: Temperature;
    max: Temperature;
  };
  condition: WeatherCondition;
  precipitationChance: number;
  humidity: number;
  windSpeed?: number;
}

export class WeatherForecast {
  private constructor(
    private readonly _city: City,
    private readonly _coordinates: Coordinates,
    private readonly _periods: ForecastPeriod[],
    private readonly _generatedAt: Date,
    private readonly _validUntil: Date
  ) {}

  public static create(params: {
    city: City;
    coordinates: Coordinates;
    periods: ForecastPeriod[];
    validHours?: number;
  }): WeatherForecast {
    WeatherForecast.validatePeriods(params.periods);
    
    const validUntil = new Date();
    validUntil.setHours(validUntil.getHours() + (params.validHours || 24));

    return new WeatherForecast(
      params.city,
      params.coordinates,
      params.periods.sort((a, b) => a.date.getTime() - b.date.getTime()),
      new Date(),
      validUntil
    );
  }

  public static fromExternalApi(params: {
    city: string;
    coordinates: { lat: number; lon: number };
    periods: Array<{
      date: string | Date;
      minTemp: number;
      maxTemp: number;
      condition: WeatherCondition;
      precipitationChance: number;
      humidity: number;
      windSpeed?: number;
    }>;
    validHours?: number;
  }): WeatherForecast {
    const forecastPeriods: ForecastPeriod[] = params.periods.map(period => ({
      date: typeof period.date === 'string' ? new Date(period.date) : period.date,
      temperature: {
        min: Temperature.fromCelsius(period.minTemp),
        max: Temperature.fromCelsius(period.maxTemp)
      },
      condition: period.condition,
      precipitationChance: period.precipitationChance,
      humidity: period.humidity,
      windSpeed: period.windSpeed
    }));

    return WeatherForecast.create({
      city: City.fromString(params.city),
      coordinates: new Coordinates(params.coordinates.lat, params.coordinates.lon),
      periods: forecastPeriods,
      validHours: params.validHours
    });
  }

  private static validatePeriods(periods: ForecastPeriod[]): void {
    if (periods.length === 0) {
      throw new Error('Forecast must contain at least one period');
    }

    if (periods.length > 14) {
      throw new Error('Forecast cannot contain more than 14 days');
    }

    periods.forEach((period, index) => {
      if (period.precipitationChance < 0 || period.precipitationChance > 100) {
        throw new Error(`Invalid precipitation chance at period ${index}: ${period.precipitationChance}%`);
      }

      if (period.humidity < 0 || period.humidity > 100) {
        throw new Error(`Invalid humidity at period ${index}: ${period.humidity}%`);
      }

      if (period.temperature.min.getCelsius() > period.temperature.max.getCelsius()) {
        throw new Error(`Min temperature cannot be higher than max temperature at period ${index}`);
      }
    });

    for (let i = 1; i < periods.length; i++) {
      if (periods[i].date.getTime() <= periods[i - 1].date.getTime()) {
        throw new Error('Forecast periods must be in chronological order');
      }
    }
  }

  public isExpired(): boolean {
    return Date.now() > this._validUntil.getTime();
  }

  public isStale(maxAgeHours: number = 6): boolean {
    const ageHours = (Date.now() - this._generatedAt.getTime()) / (1000 * 60 * 60);
    return ageHours > maxAgeHours;
  }

  public getForecastForDate(date: Date): ForecastPeriod | null {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    return this._periods.find(period => {
      const periodDate = new Date(period.date);
      periodDate.setHours(0, 0, 0, 0);
      return periodDate.getTime() === targetDate.getTime();
    }) || null;
  }

  public getForecastForNext(days: number): ForecastPeriod[] {
    if (days <= 0) return [];
    
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + days);

    return this._periods.filter(period => 
      period.date >= now && period.date <= endDate
    );
  }

  public hasRainInPeriod(days: number): boolean {
    const forecast = this.getForecastForNext(days);
    return forecast.some(period => period.precipitationChance > 30);
  }

  public getAverageTemperature(): { min: Temperature; max: Temperature } {
    if (this._periods.length === 0) {
      throw new Error('Cannot calculate average for empty forecast');
    }

    const minTemps = this._periods.map(p => p.temperature.min.getCelsius());
    const maxTemps = this._periods.map(p => p.temperature.max.getCelsius());

    const avgMin = minTemps.reduce((sum, temp) => sum + temp, 0) / minTemps.length;
    const avgMax = maxTemps.reduce((sum, temp) => sum + temp, 0) / maxTemps.length;

    return {
      min: Temperature.fromCelsius(avgMin),
      max: Temperature.fromCelsius(avgMax)
    };
  }

  public getExtremeWeatherDays(): ForecastPeriod[] {
    return this._periods.filter(period => {
      const minTemp = period.temperature.min.getCelsius();
      const maxTemp = period.temperature.max.getCelsius();
      const isExtreme = minTemp < -10 || maxTemp > 35 || period.precipitationChance > 70;
      const isSevere = ['thunderstorm', 'tornado', 'hurricane', 'blizzard'].some(condition =>
        period.condition.main.toLowerCase().includes(condition)
      );
      
      return isExtreme || isSevere;
    });
  }

  public getSummary(): {
    totalDays: number;
    averageTemp: { min: number; max: number };
    rainDays: number;
    extremeWeatherDays: number;
    mostCommonCondition: string;
    } {
    const avg = this.getAverageTemperature();
    const rainDays = this._periods.filter(p => p.precipitationChance > 30).length;
    const extremeDays = this.getExtremeWeatherDays().length;

    const conditionCounts = this._periods.reduce((acc, period) => {
      acc[period.condition.main] = (acc[period.condition.main] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonCondition = Object.entries(conditionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Unknown';

    return {
      totalDays: this._periods.length,
      averageTemp: {
        min: Math.round(avg.min.getCelsius() * 10) / 10,
        max: Math.round(avg.max.getCelsius() * 10) / 10
      },
      rainDays,
      extremeWeatherDays: extremeDays,
      mostCommonCondition
    };
  }

  public get city(): City {
    return this._city;
  }

  public get coordinates(): Coordinates {
    return this._coordinates;
  }

  public get periods(): ReadonlyArray<ForecastPeriod> {
    return [...this._periods];
  }

  public get generatedAt(): Date {
    return new Date(this._generatedAt);
  }

  public get validUntil(): Date {
    return new Date(this._validUntil);
  }

  // Serialization for API responses
  public toApiResponse(): object {
    return {
      city: this._city.toString(),
      coordinates: {
        latitude: this._coordinates.getLatitude(),
        longitude: this._coordinates.getLongitude()
      },
      generatedAt: this._generatedAt.toISOString(),
      validUntil: this._validUntil.toISOString(),
      periods: this._periods.map(period => ({
        date: period.date.toISOString(),
        temperature: {
          min: period.temperature.min.getCelsius(),
          max: period.temperature.max.getCelsius(),
          minF: period.temperature.min.getFahrenheit(),
          maxF: period.temperature.max.getFahrenheit()
        },
        condition: period.condition,
        precipitationChance: period.precipitationChance,
        humidity: period.humidity,
        windSpeed: period.windSpeed
      })),
      summary: this.getSummary(),
      metadata: {
        isExpired: this.isExpired(),
        isStale: this.isStale(),
        hasRainNext3Days: this.hasRainInPeriod(3),
        extremeWeatherDays: this.getExtremeWeatherDays().length
      }
    };
  }
}
