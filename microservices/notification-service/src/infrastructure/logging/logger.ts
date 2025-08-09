import winston, { format } from 'winston';

const LOG_SAMPLING_RATE = parseFloat(process.env.LOG_SAMPLING_RATE || '1.0');
const ENABLE_DEBUG = process.env.NODE_ENV === 'development' || process.env.ENABLE_DEBUG === 'true';
const SERVICE_NAME = 'notification-service';

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
        new winston.transports.Console({
          format: ENABLE_DEBUG ? format.combine(format.colorize(), format.simple()) : logFormat
        }),
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

  logRequest(req: any, res: any, responseTime?: number) {
    const meta = {
      method: req.method,
      url: req.url,
      userAgent: req.get?.('User-Agent'),
      ip: req.ip,
      statusCode: res.statusCode,
      responseTime: responseTime ? `${responseTime}ms` : undefined,
      correlationId: req.correlationId
    };
    if (res.statusCode >= 500) { this.error(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, meta); }
    else if (res.statusCode >= 400) { this.warn(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, meta); }
    else { this.info(`HTTP ${res.statusCode} - ${req.method} ${req.url}`, meta); }
  }

  logOperation(operation: string, success: boolean, meta: any = {}) {
    const message = `${operation} ${success ? 'completed successfully' : 'failed'}`;
    if (success) { this.info(message, { operation, success, ...meta }); }
    else { this.error(message, { operation, success, ...meta }); }
  }

  logEvent(eventType: string, meta: any = {}) {
    this.info(`Domain event: ${eventType}`, { eventType, ...meta });
  }
}

export const logger = new Logger();

