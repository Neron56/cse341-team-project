import { getUserById } from '../models/users.js';
import { destroyUserSession, sessionIdentity } from '../includes/user-session.js';

const loadSessionUser = async (req, res, next) => {
  req.user = null;
  res.locals.user = null;
  if (!req.session?.user) {
    return next();
  }

  try {
    // A session identifies the account; current DB data grants its privileges.
    const user = await getUserById(req.session.user.id);
    if (!user || !user.role) {
      await destroyUserSession(req, res);
      return next();
    }
    req.user = user;
    req.session.user = sessionIdentity(user);
    res.locals.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

const requireApiLogin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  return next();
};

const requirePageLogin = (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  return next();
};

const requireApiRole = (roleName) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== roleName) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

const requirePageRole = (roleName) => (req, res, next) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  if (req.user.role !== roleName) {
    return res.status(403).render('errors/403', {
      title: 'Forbidden',
      message: 'You do not have permission to view this page.'
    });
  }
  return next();
};

export {
  loadSessionUser,
  requireApiLogin,
  requireApiRole,
  requirePageLogin,
  requirePageRole
};
