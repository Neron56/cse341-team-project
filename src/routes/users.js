import { Router } from 'express';
import { requireApiLogin, requirePageLogin } from '../middleware/auth.js';
import { requireUserAccess, requireUserMutationToken } from '../middleware/user-admin.js';
import { userAdminPage, listUsers, updateUser, deleteUser } from '../controllers/users.js';

export const userPages = Router();
userPages.get('/admin/users', requirePageLogin, (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  return next();
}, userAdminPage);

export const userApi = Router();
userApi.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  return next();
});
userApi.use(requireApiLogin);

/**
 * @openapi
 * components:
 *   securitySchemes:
 *     sessionCookie:
 *       type: apiKey
 *       in: cookie
 *       name: kizuna.sid
 *   schemas:
 *     PublicUser:
 *       type: object
 *       required: [id, displayName, username, email, role]
 *       properties:
 *         id:
 *           type: string
 *           pattern: '^[a-fA-F0-9]{24}$'
 *         displayName:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           enum: [customer, admin]
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     UserProfileUpdate:
 *       type: object
 *       minProperties: 1
 *       additionalProperties: false
 *       properties:
 *         displayName:
 *           type: string
 *           minLength: 1
 *           maxLength: 80
 *         username:
 *           type: string
 *           pattern: '^[a-zA-Z0-9._-]{3,32}$'
 *         email:
 *           type: string
 *           format: email
 *           maxLength: 254
 *     UserApiError:
 *       type: object
 *       required: [error]
 *       properties:
 *         error:
 *           type: string
 *   responses:
 *     UserApiFailure:
 *       description: Request failed; no internal database details are returned
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserApiError'
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all profiles for an admin or only the current customer's profile
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       '200':
 *         description: Safe profiles and a session-bound token for mutations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [users, currentUserId, csrfToken]
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PublicUser'
 *                 currentUserId:
 *                   type: string
 *                 csrfToken:
 *                   type: string
 *                   description: Send in X-CSRF-Token on PATCH and DELETE
 *       '401':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '500':
 *         $ref: '#/components/responses/UserApiFailure'
 * /api/users/{id}:
 *   parameters:
 *     - in: path
 *       name: id
 *       required: true
 *       schema:
 *         type: string
 *         pattern: '^[a-fA-F0-9]{24}$'
 *     - in: header
 *       name: X-CSRF-Token
 *       required: true
 *       description: Session token returned by GET /api/users
 *       schema:
 *         type: string
 *   patch:
 *     tags: [Users]
 *     summary: Update a profile as its owner or an admin
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserProfileUpdate'
 *     responses:
 *       '200':
 *         description: Updated safe profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [user]
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/PublicUser'
 *       '400':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '401':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '403':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '404':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '409':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '500':
 *         $ref: '#/components/responses/UserApiFailure'
 *   delete:
 *     tags: [Users]
 *     summary: Delete a profile as its owner or an admin
 *     security:
 *       - sessionCookie: []
 *     responses:
 *       '200':
 *         description: Deleted account ID and whether the caller was signed out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [deletedId, signedOut]
 *               properties:
 *                 deletedId:
 *                   type: string
 *                 signedOut:
 *                   type: boolean
 *       '400':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '401':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '403':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '404':
 *         $ref: '#/components/responses/UserApiFailure'
 *       '500':
 *         $ref: '#/components/responses/UserApiFailure'
 */
userApi.get('/', listUsers);
userApi.patch('/:id', requireUserAccess, requireUserMutationToken, updateUser);
userApi.delete('/:id', requireUserAccess, requireUserMutationToken, deleteUser);
