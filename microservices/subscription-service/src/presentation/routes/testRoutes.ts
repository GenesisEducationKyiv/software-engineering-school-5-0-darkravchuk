import { Router } from 'express';

const router = Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Test route working', timestamp: new Date().toISOString() });
});

router.get('/health-test', (req, res) => {
  res.json({ status: 'ok', service: 'subscription-test' });
});

export { router as testRoutes };
