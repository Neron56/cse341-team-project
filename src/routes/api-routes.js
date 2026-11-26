import { Router } from 'express';
import { createUsersList } from '../controllers/users.js';
import { requireApiRole } from '../middleware/auth.js';

const router = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get a paginated list of users, sorted by username by default
 *     tags:
 *       - users
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: The page number of the list (default 1)
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: How many rows to display per page (default 10)
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *       - in: query
 *         name: sort
 *         required: false
 *         description: Which field to sort by (default username)
 *         schema:
 *           type: string
 *           enum: [displayName, username, email]
 *       - in: query
 *         name: order
 *         required: false
 *         description: Sort direction (default asc)
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *     responses:
 *       200:
 *         description: Users returned successfully
 *       400:
 *         description: Invalid page, limit, or sort value
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Authenticated but not an admin
 *       500:
 *         description: Unable to retrieve users
 */
router.get('/users', requireApiRole('admin'), createUsersList)

export default router;