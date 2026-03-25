const express = require('express');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(auth(true), requireRole('admin'));

router.get('/stats', async (_req, res) => {
  try {
    const [users, cars, bookings] = await Promise.all([
      User.countDocuments(),
      Car.countDocuments(),
      Booking.countDocuments(),
    ]);
    res.json({ users, cars, bookings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 }).limit(200).lean();
    res.json({ users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
