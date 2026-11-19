import railTripsRouter from './trips.js';
import { trainsApi, trainsPage } from './trains.js';
import { Router } from 'express';
import { homePage, aboutPage, testErrorPage } from './index.js';
import { loginPage, registerPage } from './users.js';
import { processLoginForm, processLogout, processUserRegistrationForm, } from '../controllers/users.js';
import { adminPage } from './admin.js';
import { requirePageRole } from '../middleware/auth.js';

const router = Router();

// Home page
router.get('/', homePage);

// About page
router.get('/about', aboutPage);

// Trains page
router.get('/trains', trainsPage);

// Trains API
router.get('/api/trains', trainsApi);

// Rail trips
router.use('/trips', railTripsRouter);

// Test 500 error page
router.get('/500', testErrorPage);

router.get('/login', loginPage);
router.post('/login', processLoginForm);

router.get('/register', registerPage);
router.post('/register', processUserRegistrationForm)

router.get('/adminDashboard', requirePageRole('admin'), adminPage)

router.get('/logout', processLogout);

export default router;