import { Router } from 'express';
import { healthCheckController } from '../controller/health';

export const router = Router();

router.get('/', healthCheckController);

export default router;
