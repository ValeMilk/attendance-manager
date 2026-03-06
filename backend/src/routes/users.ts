import { Router } from 'express';
import { User } from '../models/User.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { Response } from 'express';

const router = Router();

// List users (admin only)
router.get('/', authenticateJWT, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
