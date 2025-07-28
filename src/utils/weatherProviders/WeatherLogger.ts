import fs from 'fs';
import path from 'path';

export class WeatherLogger {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.join(process.cwd(), 'logs', 'weather-providers.log');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFilePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  logResponse(providerName: string, city: string, response: any, success: boolean): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      provider: providerName,
      city,
      success,
      response: success ? response : { error: response.message || 'Unknown error' }
    };

    const logLine = `${timestamp} - ${providerName} - Response: ${JSON.stringify(logEntry)}\n`;
    
    try {
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to weather log file:', error);
    }
  }

  logAttempt(providerName: string, city: string): void {
    const timestamp = new Date().toISOString();
    const logLine = `${timestamp} - ${providerName} - Attempting to fetch weather for ${city}\n`;
    
    try {
      fs.appendFileSync(this.logFilePath, logLine);
    } catch (error) {
      console.error('Failed to write to weather log file:', error);
    }
  }
} 