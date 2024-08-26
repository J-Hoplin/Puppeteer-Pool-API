import { Router } from 'express';
import {
  healthCheckController,
  processMetricCheckController,
} from '../controller/health';

export const router = Router();

router.get('/', healthCheckController);
router.get('/metrics', processMetricCheckController);

export default router;
