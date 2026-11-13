import { Router } from 'express';
import apiRoutes from './api-routes.js';
import ejsRoutes from './ejs-routes.js';

const router = Router();

router.use('/api', apiRoutes);
router.use('/', ejsRoutes);

export default router;
