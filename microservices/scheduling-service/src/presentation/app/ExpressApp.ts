import express from 'express';
import { createScheduleRoutes } from '../routes/scheduleRoutes';
import { ScheduleController } from '../controllers/ScheduleController';
import { logger } from '../../infrastructure/logging/logger';
import { metricsCollector } from '../../infrastructure/metrics/metrics';

export class ExpressApp {
  private app: express.Application;

  constructor(private readonly scheduleController: ScheduleController) {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(express.json({ limit: '10mb' }));
    
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    this.app.use((req, res, next) => {
      const start = Date.now();
      const originalJson = res.json.bind(res);
      res.json = ((body: any) => {
        const rt = Date.now() - start;
        metricsCollector.recordRequest(res.statusCode, rt);
        logger.info(`HTTP ${res.statusCode} - ${req.method} ${req.path}`, { responseTime: `${rt}ms` });
        return originalJson(body);
      }) as any;
      next();
    });
  }

  private setupRoutes(): void {
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'scheduling-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    this.app.get('/metrics', (req, res) => {
      res.json({ timestamp: new Date().toISOString(), ...metricsCollector.getMetrics() });
    });

    this.app.use('/api', createScheduleRoutes(this.scheduleController));

    this.app.get('/', (req, res) => {
      res.json({
        service: 'Scheduling Service',
        version: '1.0.0',
        description: 'Weather scheduling microservice with N-layer architecture',
        endpoints: {
          health: '/health',
          schedules: '/api/schedules',
          documentation: 'See README.md for API documentation'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use('/*any', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method
      });
    });

    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', { error: error.message, stack: error.stack });
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  listen(port: number): void {
    this.app.listen(port, () => {
      logger.info('Scheduling Service running', { port });
    });
  }
}
