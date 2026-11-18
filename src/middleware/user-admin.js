import { randomBytes, timingSafeEqual } from 'node:crypto';

export function userAdminToken(req) {
  if (!req.session.userAdminCsrfToken) {
    req.session.userAdminCsrfToken = randomBytes(32).toString('hex');
  }
  return req.session.userAdminCsrfToken;
}

export function requireUserMutationToken(req, res, next) {
  const expected = req.session?.userAdminCsrfToken;
  const supplied = req.get('X-CSRF-Token');
  if (typeof expected !== 'string' || typeof supplied !== 'string'
    || !/^[a-f\d]{64}$/.test(expected) || !/^[a-f\d]{64}$/.test(supplied)
    || !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))) {
    return res.status(403).json({ error: 'Invalid request token. Refresh the page and try again.' });
  }
  return next();
}

export function requireUserAccess(req, res, next) {
  const { id } = req.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  req.targetUserId = id.toLowerCase();
  if (req.user.role !== 'admin' && req.user.id !== req.targetUserId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
}
