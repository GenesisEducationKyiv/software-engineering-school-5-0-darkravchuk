import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'subscription-service-minimal',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/test', (req, res) => {
  res.json({ 
    message: 'Minimal test successful',
    timestamp: new Date().toISOString() 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.originalUrl
  });
});

app.listen(port, () => {
  console.log(`Minimal Subscription Service running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});
