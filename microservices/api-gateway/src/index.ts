import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { metricsCollector } from './utils/metrics';
import {
  correlationIdMiddleware,
  requestTimingMiddleware,
  metricsMiddleware,
  errorHandlingMiddleware,
  proxyLoggingMiddleware
} from './middleware/observability';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Observability middleware (order is important)
app.use(correlationIdMiddleware);
app.use(requestTimingMiddleware);

// CORS and body parsing middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-correlation-id'],
  exposedHeaders: ['x-correlation-id'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics collection middleware
app.use(metricsMiddleware);

// Global timeout for all requests
app.use((req, res, next) => {
  const timeoutDuration = parseInt(process.env.REQUEST_TIMEOUT || '10000');
  res.setTimeout(timeoutDuration, () => {
    logger.error('Request timeout occurred', {
      method: req.method,
      path: req.path,
      correlationId: req.correlationId,
      timeout: timeoutDuration
    });
    res.status(504).json({ 
      error: 'Gateway timeout',
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  });
  next();
});

// Service URLs
const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3001';
const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || 'http://weather-service:3002';
const SCHEDULING_SERVICE_URL = process.env.SCHEDULING_SERVICE_URL || 'http://scheduling-service:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';

// Gateway health check
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      subscription: SUBSCRIPTION_SERVICE_URL,
      weather: WEATHER_SERVICE_URL,
      scheduling: SCHEDULING_SERVICE_URL,
      notification: NOTIFICATION_SERVICE_URL
    }
  };
  
  logger.debug('Health check requested', {
    correlationId: req.correlationId,
    uptime: healthData.uptime
  });
  
  res.json(healthData);
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  const metrics = metricsCollector.getMetrics();
  
  logger.info('Metrics requested', {
    correlationId: req.correlationId,
    requestedBy: req.ip,
    totalRequests: metrics.requests.total
  });
  
  res.json({
    timestamp: new Date().toISOString(),
    ...metrics
  });
});

// Root endpoint
app.get('/', (req, res) => {
  const apiInfo = {
    service: 'Weather Microservices API Gateway',
    version: '1.0.0',
    description: 'Central API Gateway for weather subscription microservices',
    endpoints: {
      subscriptions: '/api/v1/subscriptions/*',
      subscriptionsHealth: '/api/v1/subscriptions/health',
      weather: '/api/weather/*',
      weatherHealth: '/api/weather/health',
      schedules: '/api/schedules/*',
      schedulesHealth: '/api/schedules/health',
      notifications: '/api/notifications/*',
      notificationsHealth: '/api/notifications/health',
      health: '/health',
      metrics: '/metrics'
    },
    architecture: 'Microservices with RabbitMQ messaging',
    observability: {
      logging: 'Winston with structured logging and sampling',
      metrics: 'Custom metrics collection',
      correlationId: 'Request tracking across services'
    }
  };
  
  logger.info('API Gateway info requested', {
    correlationId: req.correlationId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.json(apiInfo);
});

// Subscription Service - Health Check
app.use('/api/v1/subscriptions/health', createProxyMiddleware({
  target: SUBSCRIPTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/subscriptions/health': '/health'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('subscription-service')
}));

// Subscription Service - Other Routes
app.use('/api/v1/subscriptions', createProxyMiddleware({
  target: SUBSCRIPTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/subscriptions': '/api/v1/subscriptions'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('subscription-service')
}));

app.use('/api/weather/health', createProxyMiddleware({
  target: WEATHER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/weather/health': '/health'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('weather-service')
}));

app.use('/api/weather', createProxyMiddleware({
  target: WEATHER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/weather': '/api/weather'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('weather-service')
}));

app.use('/api/schedules/health', createProxyMiddleware({
  target: SCHEDULING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/schedules/health': '/health'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('scheduling-service')
}));

app.use('/api/schedules', createProxyMiddleware({
  target: SCHEDULING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/schedules': '/api/v1/schedules'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('scheduling-service')
}));

app.use('/api/notifications/health', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications/health': '/health'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('notification-service')
}));

app.use('/api/notifications', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  ...proxyLoggingMiddleware('notification-service')
}));

app.use('/*', (req, res) => {
  logger.warn('Endpoint not found', {
    path: req.originalUrl,
    method: req.method,
    correlationId: req.correlationId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      '/api/v1/subscriptions/*',
      '/api/v1/subscriptions/health',
      '/api/weather/*',
      '/api/weather/health',
      '/api/schedules/*',
      '/api/schedules/health',
      '/api/notifications/*',
      '/api/notifications/health',
      '/health',
      '/metrics'
    ]
  });
});

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  logger.info('API Gateway started successfully', {
    port: PORT,
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    logSamplingRate: process.env.LOG_SAMPLING_RATE || '1.0',
    services: {
      subscription: SUBSCRIPTION_SERVICE_URL,
      weather: WEATHER_SERVICE_URL,
      scheduling: SCHEDULING_SERVICE_URL,
      notification: NOTIFICATION_SERVICE_URL
    },
    endpoints: {
      health: `http://localhost:${PORT}/health`,
      metrics: `http://localhost:${PORT}/metrics`,
      docs: `http://localhost:${PORT}/`
    }
  });
  
  logger.debug('Service routing configuration', {
    routes: [
      { path: '/api/v1/subscriptions/*', target: `${SUBSCRIPTION_SERVICE_URL}/api/v1/subscriptions` },
      { path: '/api/v1/subscriptions/health', target: `${SUBSCRIPTION_SERVICE_URL}/health` },
      { path: '/api/weather/*', target: `${WEATHER_SERVICE_URL}/api/weather` },
      { path: '/api/weather/health', target: `${WEATHER_SERVICE_URL}/health` },
      { path: '/api/schedules/*', target: `${SCHEDULING_SERVICE_URL}/api/v1/schedules` },
      { path: '/api/schedules/health', target: `${SCHEDULING_SERVICE_URL}/health` },
      { path: '/api/notifications/*', target: `${NOTIFICATION_SERVICE_URL}/api/notifications` },
      { path: '/api/notifications/health', target: `${NOTIFICATION_SERVICE_URL}/health` }
    ]
  });
});