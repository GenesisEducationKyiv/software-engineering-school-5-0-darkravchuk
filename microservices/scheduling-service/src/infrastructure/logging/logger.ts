import winston, { format } from 'winston';

const LOG_SAMPLING_RATE = parseFloat(process.env.LOG_SAMPLING_RATE || '1.0');
const ENABLE_DEBUG = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG === 'true';
const SERVICE_NAME = 'scheduling-service';

let sampleCounter = 0;

export class Logger {
  private winston: winston.Logger;
  private samplingRate: number;

  constructor(samplingRate: number = LOG_SAMPLING_RATE) {
    this.samplingRate = Math.max(0, Math.min(1, samplingRate));

    const logFormat = format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.json(),
      format.printf(({ timestamp, level, message, service, correlationId, ...meta }) => {
        const logEntry: any = { timestamp, level, service: service || SERVICE_NAME, message, ...meta };
        if (correlationId) { logEntry.correlationId = correlationId; }
        return JSON.stringify(logEntry);
      })
    );

    this.winston = winston.createLogger({
      level: ENABLE_DEBUG ? 'debug' : 'info',
      format: logFormat,
      defaultMeta: { service: SERVICE_NAME, version: '1.0.0' },
      transports: [
        new winston.transports.Console({ format: ENABLE_DEBUG ? format.combine(format.colorize(), format.simple()) : logFormat }),
        new winston.transports.File({ filename: 'logs/error.log', level: 'error', maxsize: 5242880, maxFiles: 5 }),
        new winston.transports.File({ filename: 'logs/combined.log', maxsize: 5242880, maxFiles: 5 })
      ]
    });
  }

  private shouldSample(): boolean {
    if (this.samplingRate >= 1.0) return true;
    if (this.samplingRate <= 0) return false;
    sampleCounter++;
    return (sampleCounter % Math.floor(1 / this.samplingRate)) === 0;
  }

  private log(level: string, message: string, meta: any = {}) {
    const shouldLog = level === 'error' || level === 'warn' || this.shouldSample();
    if (shouldLog) {
      this.winston.log(level, message, { ...meta, sampled: this.samplingRate < 1.0 && (level === 'info' || level === 'debug') });
    }
  }

  info(message: string, meta: any = {}) { this.log('info', message, meta); }
  warn(message: string, meta: any = {}) { this.log('warn', message, meta); }
  error(message: string, meta: any = {}) { this.log('error', message, meta); }
  debug(message: string, meta: any = {}) { this.log('debug', message, meta); }
}

export const logger = new Logger();

