import { Router } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { Response } from 'express';

const router = Router();

// Register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only first user or admin can create new users
    const userCount = await User.countDocuments();
    if (userCount > 0 && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({ message: 'Only admins can register new users' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'expectador',
    });

    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log('[AUTH] Login attempt for', email);
    console.log('[AUTH] Request body:', req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        supervisorId: user.supervisorId,
      },
      process.env.JWT_SECRET || 'your_secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
      { expiresIn: '7d' }
    );

    // Store refresh token in DB (hashed)
    const hashedRefreshToken = await bcryptjs.hash(refreshToken, 10);
    const rtRecord = new RefreshToken({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await rtRecord.save();

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        supervisorId: user.supervisorId,
      },
    });
  } catch (error) {
    console.error('[AUTH] Login error', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Refresh token
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'your_refresh_secret'
    ) as any;

    const rtRecord = await RefreshToken.findOne({ userId: decoded.userId });
    if (!rtRecord) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const isMatch = await bcryptjs.compare(refreshToken, rtRecord.token);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        supervisorId: user.supervisorId,
      },
      process.env.JWT_SECRET || 'your_secret',
      { expiresIn: '15m' }
    );

    // Optionally rotate refresh token
    const newRefreshToken = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_REFRESH_SECRET || 'your_refresh_secret',
      { expiresIn: '7d' }
    );

    const hashedNewRefreshToken = await bcryptjs.hash(newRefreshToken, 10);
    await RefreshToken.deleteOne({ _id: rtRecord._id });
    const newRtRecord = new RefreshToken({
      userId: user._id,
      token: hashedNewRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await newRtRecord.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Token refresh failed', error });
  }
});

// Logout
router.post('/logout', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    if (req.userId) {
      await RefreshToken.deleteMany({ userId: req.userId });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error });
  }
});

// Profile
router.get('/profile', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error });
  }
});

export default router;
