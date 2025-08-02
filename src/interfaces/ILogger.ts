export interface ILogger {
  logResponse(providerName: string, city: string, response: any, success: boolean): Promise<void>;
  logAttempt(providerName: string, city: string): Promise<void>;
}

export interface ILoggerConfig {
  filePath?: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole?: boolean;
  enableFile?: boolean;
}