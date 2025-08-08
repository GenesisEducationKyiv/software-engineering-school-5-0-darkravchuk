import express from 'express';
import cors from 'cors';
import { WeatherController } from './presentation/controllers';
import { createWeatherRoutes } from './presentation/routes';
import { createWeatherContainer, WeatherConfig } from './infrastructure/container';

export class WeatherService {
  private app: express.Application;
  private container: any;

  constructor(private config: WeatherConfig) {
    this.app = express();
    this.container = createWeatherContainer(config);
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes(): void {
    const weatherController = new WeatherController(
      this.container.getCurrentWeatherUseCase,
      this.container.getWeatherForecastUseCase,
      this.container.searchCitiesUseCase
    );

    this.app.use('/api/weather', createWeatherRoutes(weatherController));

    this.app.get('/health', (req, res) => {
      res.json({
        service: 'Weather Service',
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    });

    this.app.use('/*any', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
  }

  public start(port: number = 3002): void {
    this.app.listen(port, () => {
      console.log(`Weather Service is running on port ${port}`);
      console.log(`Health check: http://localhost:${port}/health`);
      console.log(`Current weather: http://localhost:${port}/api/weather/current?city=London`);
      console.log(`Forecast: http://localhost:${port}/api/weather/forecast?city=London&days=5`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}
