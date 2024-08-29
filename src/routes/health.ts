import {
  healthCheckController,
  processMetricCheckController,
} from '../controller/health';
import { Router } from 'express';

export const router = Router();

router.get('/', healthCheckController);
router.get('/metrics', processMetricCheckController);

export default router;
