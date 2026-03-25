const express = require('express');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const ms = e.getTime() - s.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/** Customer creates booking */
router.post('/', auth(true), requireRole('customer', 'admin'), async (req, res) => {
  try {
    const { carId, startDate, endDate, destination } = req.body;
    if (!carId || !startDate || !endDate || !destination) {
      return res.status(400).json({ error: 'carId, startDate, endDate, destination required' });
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) return res.status(400).json({ error: 'endDate must be after startDate' });

    const car = await Car.findById(carId);
    if (!car || !car.isActive) return res.status(404).json({ error: 'Car not available' });

    const conflicting = await Booking.find({
      carId: car._id,
      status: { $in: ['pending', 'approved'] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    })
      .limit(1)
      .lean();

    if (conflicting.length) {
      return res.status(409).json({ error: 'Those dates overlap an existing booking for this car' });
    }

    const totalDays = daysBetween(start, end);
    const estimatedTotal = Math.round(car.pricePerDay * totalDays * 100) / 100;

    const booking = await Booking.create({
      carId: car._id,
      customerId: req.user.sub,
      ownerId: car.ownerId,
      startDate: start,
      endDate: end,
      destination: String(destination).trim(),
      status: 'pending',
      totalDays,
      estimatedTotal,
    });

    const populated = await Booking.findById(booking._id)
      .populate('carId')
      .populate('customerId', 'name email')
      .populate('ownerId', 'name email')
      .lean();

    res.status(201).json({ booking: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Booking failed' });
  }
});

/** Customer: my bookings */
router.get('/mine', auth(true), requireRole('customer', 'admin'), async (req, res) => {
  try {
    const bookings = await Booking.find({ customerId: req.user.sub })
      .populate('carId')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ bookings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

/** Owner: booking requests for my cars */
router.get('/owner/incoming', auth(true), requireRole('owner', 'admin'), async (req, res) => {
  try {
    const bookings = await Booking.find({ ownerId: req.user.sub })
      .populate('carId')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ bookings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.patch('/:id/status', auth(true), requireRole('owner', 'admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' });
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && booking.ownerId.toString() !== req.user.sub) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is no longer pending' });
    }

    if (status === 'approved') {
      const overlap = await Booking.findOne({
        _id: { $ne: booking._id },
        carId: booking.carId,
        status: { $in: ['approved'] },
        startDate: { $lt: booking.endDate },
        endDate: { $gt: booking.startDate },
      });
      if (overlap) {
        return res.status(409).json({ error: 'Another approved booking conflicts with these dates' });
      }
    }

    booking.status = status;
    await booking.save();
    const populated = await Booking.findById(booking._id)
      .populate('carId')
      .populate('customerId', 'name email')
      .populate('ownerId', 'name email')
      .lean();
    res.json({ booking: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

/** Availability for calendar — blocked ranges for a car */
router.get('/availability/:carId', async (req, res) => {
  try {
    const bookings = await Booking.find({
      carId: req.params.carId,
      status: { $in: ['pending', 'approved'] },
    })
      .select('startDate endDate status')
      .lean();
    res.json({ bookings });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
