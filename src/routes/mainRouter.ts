import { Router } from 'express';
import weatherRoutes from './weatherRouter';
import subscriptionRoutes from './subscriptionRouter';

const router = Router();

router.use('/weather', weatherRoutes);
router.use('/subscription', subscriptionRoutes);

export default router;