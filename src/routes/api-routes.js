import { Router } from 'express';
import { getAllBookings } from '../controllers/bookings.js';
import { trainsApi } from './trains.js';

const router = Router();

router.get('/trains', trainsApi);

/**
 * @swagger
 * components:
 *   schemas:
 *     Passenger:
 *       type: object
 *       required: [firstName, lastName, email, phone]
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         phone:
 *           type: string
 *     Booking:
 *       type: object
 *       required: [id, scheduleId, tripId, ticketClass, selectedDay, passengers, createdAt]
 *       properties:
 *         id:
 *           type: string
 *           example: JR0123456789ABCDEF
 *         scheduleId:
 *           type: integer
 *           minimum: 1
 *         tripId:
 *           type: string
 *           example: alpine-panorama
 *         ticketClass:
 *           type: string
 *           example: premium
 *         selectedDay:
 *           type: string
 *           enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *         passengers:
 *           type: array
 *           minItems: 1
 *           maxItems: 8
 *           items:
 *             $ref: '#/components/schemas/Passenger'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * /api/bookings:
 *   get:
 *     summary: Return all bookings, newest first
 *     tags: [Bookings]
 *     responses:
 *       '200':
 *         description: Bookings returned successfully (array may be empty)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [bookings]
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *       '500':
 *         description: Failed to fetch bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [error]
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to fetch bookings
 */
router.get('/bookings', getAllBookings);

export default router;
