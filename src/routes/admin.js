import { Router } from 'express';
import { requireApiRole, requirePageRole } from '../middleware/auth.js';

const router = Router();

router.get('/admin', requirePageRole('admin'), (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard'
  });
});

router.get('/api/admin/dashboard', requireApiRole('admin'), (req, res) => {
  return res.json({ message: 'Welcome to the Admin Dashboard', user: req.user });
});

export default router;
