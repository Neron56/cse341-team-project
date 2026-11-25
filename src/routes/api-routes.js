import { Router } from 'express';
import { getAllStations, getStationById } from '../controllers/stations.js';

const router = Router();

/**
 * @openapi
 * components:
 *   schemas:
 *     Station:
 *       type: object
 *       required: [id, name, prefecture, region]
 *       properties:
 *         id:
 *           type: string
 *           example: nagoya
 *         name:
 *           type: string
 *           example: Nagoya Station
 *         prefecture:
 *           type: string
 *           example: Aichi
 *         region:
 *           type: string
 *           example: central
 *         facilities:
 *           type: array
 *           items:
 *             type: string
 *           default: []
 *         description:
 *           type: string
 *           default: ''
 *     StationError:
 *       type: object
 *       required: [error]
 *       properties:
 *         error:
 *           type: string
 * /api/stations:
 *   get:
 *     summary: List stations sorted by name
 *     tags: [Stations]
 *     responses:
 *       '200':
 *         description: Stations, including an empty array when none exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [stations]
 *               properties:
 *                 stations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Station'
 *       '500':
 *         description: Failed to fetch stations
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationError'
 * /api/stations/{id}:
 *   get:
 *     summary: Get a station by its public string ID
 *     tags: [Stations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Public station ID used by trip startStation and endStation
 *         schema:
 *           type: string
 *         example: nagoya
 *     responses:
 *       '200':
 *         description: Station found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [station]
 *               properties:
 *                 station:
 *                   $ref: '#/components/schemas/Station'
 *       '404':
 *         description: No station matches the supplied ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationError'
 *       '500':
 *         description: Failed to fetch station
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StationError'
 */
router.get('/stations', getAllStations);
router.get('/stations/:id', getStationById);

export default router;
