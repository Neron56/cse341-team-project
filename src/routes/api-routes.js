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
 *     summary: Return a page of bookings sorted by booking date
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Positive safe integer; out-of-range pages return an empty array
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort createdAt and _id in the same direction for stable ties
 *     responses:
 *       '200':
 *         description: Bookings returned successfully (array may be empty)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [bookings, pagination, sort, filters]
 *               properties:
 *                 bookings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Booking'
 *                 pagination:
 *                   type: object
 *                   required: [page, limit, totalItems, totalPages, hasPreviousPage, hasNextPage]
 *                   properties:
 *                     page:
 *                       type: integer
 *                       minimum: 1
 *                     limit:
 *                       type: integer
 *                       minimum: 1
 *                       maximum: 100
 *                     totalItems:
 *                       type: integer
 *                       minimum: 0
 *                     totalPages:
 *                       type: integer
 *                       minimum: 0
 *                     hasPreviousPage:
 *                       type: boolean
 *                     hasNextPage:
 *                       type: boolean
 *                 sort:
 *                   type: object
 *                   required: [by, order]
 *                   properties:
 *                     by:
 *                       type: string
 *                       enum: [createdAt]
 *                     order:
 *                       type: string
 *                       enum: [asc, desc]
 *                 filters:
 *                   type: object
 *                   additionalProperties: false
 *                   description: No filters applied in the pagination-only endpoint
 *       '400':
 *         description: Invalid, repeated, structured, or unknown query parameter
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [error]
 *               properties:
 *                 error:
 *                   type: string
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
