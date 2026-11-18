const loadSessionUser = (req, res, next) => {
  req.user = req.session?.user || null;
  res.locals.user = req.user;
  next();
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
