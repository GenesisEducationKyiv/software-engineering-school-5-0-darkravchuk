import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Service URLs from environment variables
const SUBSCRIPTION_SERVICE_URL = process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3001';
const WEATHER_SERVICE_URL = process.env.WEATHER_SERVICE_URL || 'http://weather-service:3002';  
const SCHEDULING_SERVICE_URL = process.env.SCHEDULING_SERVICE_URL || 'http://scheduling-service:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} -> Routing to appropriate service`);
  next();
});

// Health check for API Gateway
app.get('/health', (req, res) => {
  res.json({
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
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Weather Microservices API Gateway',
    version: '1.0.0',
    description: 'Central API Gateway for weather subscription microservices',
    endpoints: {
      subscriptions: '/api/subscriptions/*',
      weather: '/api/weather/*',
      schedules: '/api/schedules/*',
      notifications: '/api/notifications/*',
      health: '/health'
    },
    architecture: 'Microservices with RabbitMQ messaging'
  });
});

// Subscription Service Proxy
app.use('/api/subscriptions', createProxyMiddleware({
  target: SUBSCRIPTION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/subscriptions': '/api/subscriptions'
  },
  onError: (err, req, res) => {
    console.error('Subscription Service Error:', err.message);
    res.status(503).json({ error: 'Subscription service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Subscription Service: ${req.method} ${req.path}`);
  }
}));

// Weather Service Proxy  
app.use('/api/weather', createProxyMiddleware({
  target: WEATHER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/weather': '/api/weather'
  },
  onError: (err, req, res) => {
    console.error('Weather Service Error:', err.message);
    res.status(503).json({ error: 'Weather service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Weather Service: ${req.method} ${req.path}`);
  }
}));

// Scheduling Service Proxy
app.use('/api/schedules', createProxyMiddleware({
  target: SCHEDULING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/schedules': '/api/schedules'
  },
  onError: (err, req, res) => {
    console.error('Scheduling Service Error:', err.message);
    res.status(503).json({ error: 'Scheduling service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Scheduling Service: ${req.method} ${req.path}`);
  }
}));

app.use('/api/notifications', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  },
  onError: (err, req, res) => {
    console.error('Notification Service Error:', err.message);
    res.status(503).json({ error: 'Notification service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Notification Service: ${req.method} ${req.path}`);
  }
}));

app.use('/*any', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/subscriptions/*',
      '/api/weather/*', 
      '/api/schedules/*',
      '/api/notifications/*',
      '/health'
    ]
  });
});

// Global error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Gateway Error:', error);
  res.status(500).json({
    error: 'Internal API Gateway error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service Routes:');
  console.log(`Subscriptions: /api/subscriptions/* → ${SUBSCRIPTION_SERVICE_URL}`);
  console.log(`Weather: /api/weather/* → ${WEATHER_SERVICE_URL}`);
  console.log(`Scheduling: /api/schedules/* → ${SCHEDULING_SERVICE_URL}`);
  console.log(`Notifications: /api/notifications/* → ${NOTIFICATION_SERVICE_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

process.on('SIGTERM', () => {
  console.log('API Gateway shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('API Gateway shutting down gracefully...');
  process.exit(0);
});
