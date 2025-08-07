import express from 'express';
import { createScheduleRoutes } from '../routes/scheduleRoutes';
import { ScheduleController } from '../controllers/ScheduleController';

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
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
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
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`Scheduling Service running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`API endpoints: http://localhost:${port}/api/schedules`);
    });
  }
}
