export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface WeatherConfig {
  weatherApiKey: string;
  openWeatherApiKey: string;
  accuWeatherApiKey: string;
}

export interface EmailConfig {
  sendGridApiKey: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface LoggerConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  filePath?: string;
  enableConsole: boolean;
  enableFile: boolean;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  timezone: string;
  database: DatabaseConfig;
  weather: WeatherConfig;
  email: EmailConfig;
  redis: RedisConfig;
  logger: LoggerConfig;
}

class ConfigurationService {
  private config: AppConfig;

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): AppConfig {
    return {
      port: parseInt(process.env.PORT || '3000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      timezone: process.env.TZ || 'UTC',
      
      database: {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'qwerty',
        database: process.env.DB_NAME || 'weather_db',
      },
      
      weather: {
        weatherApiKey: process.env.WEATHER_API_KEY || '',
        openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
        accuWeatherApiKey: process.env.ACCUWEATHER_API_KEY || '',
      },
      
      email: {
        sendGridApiKey: process.env.SENDGRID_API_KEY || '',
      },
      
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD,
      },
      
      logger: {
        level: (process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
        filePath: process.env.LOG_FILE_PATH,
        enableConsole: process.env.LOG_ENABLE_CONSOLE !== 'false',
        enableFile: process.env.LOG_ENABLE_FILE !== 'false',
      },
    };
  }

  getConfig(): AppConfig {
    return this.config;
  }

  getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  getWeatherConfig(): WeatherConfig {
    return this.config.weather;
  }

  getEmailConfig(): EmailConfig {
    return this.config.email;
  }

  getRedisConfig(): RedisConfig {
    return this.config.redis;
  }

  getLoggerConfig(): LoggerConfig {
    return this.config.logger;
  }

  getPort(): number {
    return this.config.port;
  }

  getNodeEnv(): string {
    return this.config.nodeEnv;
  }

  getTimezone(): string {
    return this.config.timezone;
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}

// Export singleton instance
export const appConfig = new ConfigurationService();