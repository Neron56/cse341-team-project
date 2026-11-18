import { Router } from 'express';
import {
  login,
  loginForm,
  logout,
  register,
  registrationForm
} from '../controllers/auth.js';
import { requireApiLogin, requirePageLogin } from '../middleware/auth.js';

const router = Router();

router.get('/register', registrationForm);
router.post('/register', register);
router.get('/login', loginForm);
router.post('/login', login);
router.post('/logout', requirePageLogin, logout);
router.get('/api/auth/me', requireApiLogin, (req, res) => res.json({ user: req.user }));

export default router;
