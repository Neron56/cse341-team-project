import {
  createUser,
  findUserByEmail,
  verifyPassword
} from '../models/users.js';

const registrationForm = (req, res) => res.render('auth/register', {
  title: 'Register',
  error: null,
  form: {}
});

const loginForm = (req, res) => res.render('auth/login', {
  title: 'Log in',
  error: null,
  registered: req.query.registered === '1',
  loggedOut: req.query.loggedOut === '1'
});

const registrationError = (res, status, error, form) => res.status(status).render('auth/register', {
  title: 'Register',
  error,
  form
});

const register = async (req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const form = { displayName, username, email };

  if (!displayName || displayName.length > 80) {
    return registrationError(res, 400, 'Enter a display name of 1 to 80 characters.', form);
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return registrationError(res, 400, 'Use 3 to 32 letters, numbers, dots, underscores, or hyphens for the username.', form);
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return registrationError(res, 400, 'Enter a valid email address.', form);
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    return registrationError(res, 400, 'Use a password of at least 12 characters and no more than 72 UTF-8 bytes.', form);
  }

  try {
    await createUser({ displayName, username, email, password });
    return res.redirect(303, '/login?registered=1');
  } catch (error) {
    if (error.code === 11000) {
      return registrationError(res, 409, 'That username or email is already registered.', form);
    }
    if (error.name === 'ValidationError') {
      return registrationError(res, 400, 'Please check the registration details and try again.', form);
    }
    return next(error);
  }
};

const saveAuthenticatedSession = (req, user) => new Promise((resolve, reject) => {
  req.session.regenerate((error) => {
    if (error) {
      reject(error);
      return;
    }

    req.session.user = {
      id: user._id.toString(),
      displayName: user.displayName,
      username: user.username,
      role: user.role.name
    };

    req.session.save((saveError) => {
      if (saveError) {
        reject(saveError);
        return;
      }
      resolve();
    });
  });
});

const login = async (req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  try {
    const user = email ? await findUserByEmail(email) : null;
    const passwordMatches = await verifyPassword(password, user?.passwordHash);
    if (!user || !passwordMatches || !user.role) {
      return res.status(401).render('auth/login', {
        title: 'Log in',
        error: 'Email or password is incorrect.',
        registered: false,
        loggedOut: false
      });
    }

    await saveAuthenticatedSession(req, user);
    return res.redirect(303, user.role.name === 'admin' ? '/admin' : '/trips');
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }
    res.clearCookie('kizuna.sid', {
      httpOnly: true,
      secure: process.env.NODE_ENV?.toLowerCase() === 'production',
      sameSite: 'lax'
    });
    return res.redirect(303, '/login?loggedOut=1');
  });
};

export { login, loginForm, logout, register, registrationForm };
