
import { Router } from 'express';
import {
    getAllTrips,
    getTripById,
} from '../controllers/trips.js';

const router = Router();

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

// Get all trips
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

// Get one trip by ID
router.get('/trips/:id', getTripById);

export default router;
