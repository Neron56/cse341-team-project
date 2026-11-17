
import { Router } from 'express';
import { getSchedulesByTripAndMonth, getSchedulesByTripId } from '../controllers/schedules.js';

const router = Router();

/**
 * @openapi
 * /api/trips/{tripId}/schedules:
 *   get:
 *     summary: Get a schedule by trip id
 *     tags:
 *       - schedules
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         description: The trip id, such as alpine-panorama
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         required: false
 *         description: Month number (1-12). Returns schedules only if the trip operates in that month.
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: schedule returned successfully
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Unable to retrieve schedule
 */
router.get('/trips/:tripId/schedules', (req, res) =>
  req.query.month ? getSchedulesByTripAndMonth(req, res) : getSchedulesByTripId(req, res)
);

export default router;