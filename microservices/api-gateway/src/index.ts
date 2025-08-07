import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} -> Routing to appropriate service`);
  next();
});

// Global timeout for all requests
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    console.error(`Request timeout: ${req.method} ${req.path}`);
    res.status(504).json({ error: 'Gateway timeout' });
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
      subscriptions: '/api/v1/subscriptions/*',
      subscriptionsHealth: '/api/v1/subscriptions/health',
      weather: '/api/weather/*',
      weatherHealth: '/api/weather/health',
      schedules: '/api/schedules/*',
      schedulesHealth: '/api/schedules/health',
      notifications: '/api/notifications/*',
      notificationsHealth: '/api/notifications/health',
      health: '/health'
    },
    architecture: 'Microservices with RabbitMQ messaging'
  });
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
  onError: (err, req, res) => {
    console.error('Subscription Service Health Error:', err.message);
    res.status(503).json({ error: 'Subscription service health check unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Subscription Service Health: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Subscription Service Health: ${proxyRes.statusCode}`);
  }
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
  onError: (err, req, res) => {
    console.error('Subscription Service Error:', err.message);
    res.status(503).json({ error: 'Subscription service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Subscription Service: ${req.method} ${req.path}`);
    console.log('Request body:', req.body);
    if (req.body) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Subscription Service: ${proxyRes.statusCode}`);
  }
}));

// Weather Service - Health Check
app.use('/api/weather/health', createProxyMiddleware({
  target: WEATHER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/weather/health': '/health'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  onError: (err, req, res) => {
    console.error('Weather Service Health Error:', err.message);
    res.status(503).json({ error: 'Weather service health check unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Weather Service Health: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Weather Service Health: ${proxyRes.statusCode}`);
  }
}));

// Weather Service - Other Routes
app.use('/api/weather', createProxyMiddleware({
  target: WEATHER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/weather': '/api/weather'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  onError: (err, req, res) => {
    console.error('Weather Service Error:', err.message);
    res.status(503).json({ error: 'Weather service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Weather Service: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Weather Service: ${proxyRes.statusCode}`);
  }
}));

// Scheduling Service - Health Check
app.use('/api/schedules/health', createProxyMiddleware({
  target: SCHEDULING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/schedules/health': '/health'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  onError: (err, req, res) => {
    console.error('Scheduling Service Health Error:', err.message);
    res.status(503).json({ error: 'Scheduling service health check unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Scheduling Service Health: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Scheduling Service Health: ${proxyRes.statusCode}`);
  }
}));

// Scheduling Service - Other Routes
app.use('/api/schedules', createProxyMiddleware({
  target: SCHEDULING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/schedules': '/api/v1/schedules'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  onError: (err, req, res) => {
    console.error('Scheduling Service Error:', err.message);
    res.status(503).json({ error: 'Scheduling service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Scheduling Service: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Scheduling Service: ${proxyRes.statusCode}`);
  }
}));

// Notification Service - Health Check
app.use('/api/notifications/health', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications/health': '/health'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  onError: (err, req, res) => {
    console.error('Notification Service Health Error:', err.message);
    res.status(503).json({ error: 'Notification service health check unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Notification Service Health: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Notification Service Health: ${proxyRes.statusCode}`);
  }
}));

// Notification Service - Other Routes
app.use('/api/notifications', createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/notifications': '/api/notifications'
  },
  timeout: 5000,
  proxyTimeout: 5000,
  onError: (err, req, res) => {
    console.error('Notification Service Error:', err.message);
    res.status(503).json({ error: 'Notification service unavailable' });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`→ Proxying to Notification Service: ${req.method} ${req.path}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`← Response from Notification Service: ${proxyRes.statusCode}`);
  }
}));

// 404 Handler
app.use('/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      '/api/v1/subscriptions/*',
      '/api/v1/subscriptions/health',
      '/api/weather/*',
      '/api/weather/health',
      '/api/schedules/*',
      '/api/schedules/health',
      '/api/notifications/*',
      '/api/notifications/health',
      '/health'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log('Service Routes:');
  console.log(`Subscriptions: /api/v1/subscriptions/* → ${SUBSCRIPTION_SERVICE_URL}/api/v1/subscriptions`);
  console.log(`Subscriptions Health: /api/v1/subscriptions/health → ${SUBSCRIPTION_SERVICE_URL}/health`);
  console.log(`Weather: /api/weather/* → ${WEATHER_SERVICE_URL}/api/weather`);
  console.log(`Weather Health: /api/weather/health → ${WEATHER_SERVICE_URL}/health`);
  console.log(`Scheduling: /api/schedules/* → ${SCHEDULING_SERVICE_URL}/api/v1/schedules`);
  console.log(`Scheduling Health: /api/schedules/health → ${SCHEDULING_SERVICE_URL}/health`);
  console.log(`Notifications: /api/notifications/* → ${NOTIFICATION_SERVICE_URL}/api/notifications`);
  console.log(`Notifications Health: /api/notifications/health → ${NOTIFICATION_SERVICE_URL}/health`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});