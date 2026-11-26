
import { Router } from 'express';

import {
    getAllTrips,
    getTripById,
    updateTrip,
    deleteTrip,
} from '../controllers/trips.js';

import {
    getAllStations,
    getStationById,
} from '../controllers/stations.js';

import {
    getSchedulesByTripAndMonth,
    getSchedulesByTripId,
} from '../controllers/schedules.js';

import { requireApiRole } from '../middleware/auth.js';

const router = Router();

// ===============================
// TRIPS API
// ===============================

/**
 * @openapi
 * /api/trips:
 *   get:
 *     summary: Get all scenic train trips
 *     tags:
 *       - Trips
 *     responses:
 *       200:
 *         description: List of all trips
 *       500:
 *         description: Failed to fetch trips
 */
router.get('/trips', getAllTrips);

/**
 * @openapi
 * /api/trips/{id}:
 *   get:
 *     summary: Get one trip by ID
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The trip ID
 *     responses:
 *       200:
 *         description: Trip found
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Failed to fetch trip
 */
router.get('/trips/:id', getTripById);

// Update a trip (admin only)
router.put('/trips/:id', requireApiRole('admin'), updateTrip);

// Delete a trip (admin only)
router.delete('/trips/:id', requireApiRole('admin'), deleteTrip);


// ===============================
// STATIONS API
// ===============================

/**
 * @openapi
 * /api/stations:
 *   get:
 *     summary: List all stations
 *     tags:
 *       - Stations
 *     responses:
 *       200:
 *         description: Stations returned successfully
 *       500:
 *         description: Failed to fetch stations
 */
router.get('/stations', getAllStations);

/**
 * @openapi
 * /api/stations/{id}:
 *   get:
 *     summary: Get a station by ID
 *     tags:
 *       - Stations
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Station found
 *       404:
 *         description: Station not found
 */
router.get('/stations/:id', getStationById);


// ===============================
// SCHEDULES API
// ===============================

/**
 * @openapi
 * /api/trips/{tripId}/schedules:
 *   get:
 *     summary: Get schedules for a trip
 *     tags:
 *       - Schedules
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: Schedules returned successfully
 *       404:
 *         description: Schedules not found
 *       500:
 *         description: Unable to retrieve schedules
 */
router.get('/trips/:tripId/schedules', (req, res) =>
    req.query.month
        ? getSchedulesByTripAndMonth(req, res)
        : getSchedulesByTripId(req, res)
);

export default router;
