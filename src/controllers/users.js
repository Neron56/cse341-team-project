import {
  getAllUsers, updateUserById, deleteUserById
} from '../models/users.js';
import { userAdminToken } from '../middleware/user-admin.js';
import { destroyUserSession, sessionIdentity } from '../includes/user-session.js';

export function userAdminPage(req, res) {
  const title = req.user.role === 'admin' ? 'User Administration' : 'My Account';
  return res.render('admin/users', { title });
}

export async function listUsers(req, res) {
  try {
    const users = req.user.role === 'admin' ? await getAllUsers() : [req.user];
    return res.status(200).json({
      users, currentUserId: req.user.id, csrfToken: userAdminToken(req)
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}

const validateChanges = (body) => {
  const allowed = ['displayName', 'username', 'email'];
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || !Object.keys(body).length
    || Object.keys(body).some((key) => !allowed.includes(key))) {
    return null;
  }
  const changes = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'string') {
      return null;
    }
    changes[key] = key === 'displayName' ? value.trim() : value.trim().toLowerCase();
  }
  if (Object.hasOwn(changes, 'displayName')
    && (!changes.displayName || changes.displayName.length > 80)) {
    return null;
  }
  if (Object.hasOwn(changes, 'username') && !/^[a-z0-9._-]{3,32}$/.test(changes.username)) {
    return null;
  }
  if (Object.hasOwn(changes, 'email')
    && (changes.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(changes.email))) {
    return null;
  }
  return changes;
};

export async function updateUser(req, res) {
  const changes = validateChanges(req.body);
  if (!changes) {
    return res.status(400).json({ error: 'Provide valid display name, username, or email fields only.' });
  }
  try {
    const user = await updateUserById(req.targetUserId, changes);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.id === req.user.id) {
      req.session.user = sessionIdentity(user);
    }
    return res.status(200).json({ user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'That username or email is already registered.' });
    }
    if (error.name === 'ValidationError' || error.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid profile details' });
    }
    console.error('Failed to update user:', error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function deleteUser(req, res) {
  try {
    const deletedId = await deleteUserById(req.targetUserId);
    if (!deletedId) {
      return res.status(404).json({ error: 'User not found' });
    }
    const signedOut = deletedId === req.user.id;
    if (signedOut) {
      await destroyUserSession(req, res);
    }
    return res.status(200).json({ deletedId, signedOut });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
}
