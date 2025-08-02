import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';
import { ILogger, ILoggerConfig } from '../../interfaces/ILogger';

export class WeatherLogger implements ILogger {
  private logFilePath: string;
  private config: ILoggerConfig;

  constructor(config?: ILoggerConfig) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableFile: true,
      ...config
    };
    
    this.logFilePath = this.config.filePath || path.join(process.cwd(), 'logs', 'weather-providers.log');
    this.ensureLogDirectory();
  }

  private async ensureLogDirectory(): Promise<void> {
    if (!this.config.enableFile) return;
    
    const logDir = path.dirname(this.logFilePath);
    try {
      if (!existsSync(logDir)) {
        await fs.mkdir(logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create log directory:', error);
      throw error;
    }
  }

  private shouldLog(level: string): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level as keyof typeof levels] >= levels[this.config.level];
  }

  private async writeToFile(logLine: string): Promise<void> {
    if (!this.config.enableFile) return;
    
    try {
      await fs.appendFile(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to weather log file:', error);
      throw error;
    }
  }

  private writeToConsole(logLine: string): void {
    if (!this.config.enableConsole) return;
    
    console.log(logLine.trim());
  }

  async logResponse(providerName: string, city: string, response: any, success: boolean): Promise<void> {
    if (!this.shouldLog('info')) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = [
      timestamp,
      providerName,
      city,
      success,
      success ? response : { error: response.message || 'Unknown error' },
    ];

    const logLine = `${timestamp} - ${providerName} - Response: ${JSON.stringify(logEntry)}\n`;
    
    await this.writeToFile(logLine);
    this.writeToConsole(logLine);
  }

  async logAttempt(providerName: string, city: string): Promise<void> {
    if (!this.shouldLog('debug')) return;
    
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp} - ${providerName} - Attempting to fetch weather for ${city}\n`;

    await this.writeToFile(logLine);
    this.writeToConsole(logLine);
  }
}