const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, signToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'email, password, name, and role are required' });
    }
    if (!['customer', 'owner'].includes(role)) {
      return res.status(400).json({ error: 'role must be customer or owner' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: String(email).toLowerCase().trim(),
      passwordHash,
      name: String(name).trim(),
      role,
    });

    const token = signToken({ sub: user._id.toString(), role: user.role, email: user.email });
    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken({ sub: user._id.toString(), role: user.role, email: user.email });
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', auth(true), async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).select('-passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.patch('/profile', auth(true), async (req, res) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const { name, phone, bio } = req.body;
    if (name) user.name = String(name).trim();
    if (phone !== undefined) user.profile.phone = String(phone);
    if (bio !== undefined) user.profile.bio = String(bio);
    await user.save();
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profile: user.profile,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
