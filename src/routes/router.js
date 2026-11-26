
import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import apiRoutes from './api-routes.js';
import { requirePageRole } from '../middleware/auth.js';

const router = Router();

// API routes
router.use('/api', apiRoutes);

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Protected Admin Trips page
router.get(
    '/admin/trips',
    requirePageRole('admin'),
    (req, res) => {
        res.render('admin/trips', {
            title: 'Manage Train Trips'
        });
    }
);

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

export default router;
