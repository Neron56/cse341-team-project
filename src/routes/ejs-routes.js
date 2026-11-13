import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { trainsPage } from './trains.js';
import { bookingsAdminPage } from '../controllers/bookings.js';
import railTripsRouter from './trips.js';

const router = Router();

router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/trains', trainsPage);
router.get('/bookings-admin', bookingsAdminPage);
router.use('/trips', railTripsRouter);
router.get('/500', testErrorPage);

export default router;
