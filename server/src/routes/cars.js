const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Car = require('../models/Car');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || '.jpg'}`;
    cb(null, safe);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) {
      return cb(new Error('Only image files allowed'));
    }
    cb(null, true);
  },
});

/** Owner's cars — must be before /:id */
router.get('/owner/mine', auth(true), requireRole('owner', 'admin'), async (req, res) => {
  try {
    const cars = await Car.find({ ownerId: req.user.sub }).sort({ createdAt: -1 }).lean();
    const base = `${req.protocol}://${req.get('host')}`;
    const mapped = cars.map((c) => ({
      ...c,
      images: (c.images || []).map((img) => `${base}/uploads/${path.basename(img)}`),
    }));
    res.json({ cars: mapped });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

/** Public list + filters */
router.get('/', async (req, res) => {
  try {
    const { location, maxPrice, carType, q } = req.query;
    const filter = { isActive: true };
    if (location) filter.location = new RegExp(String(location).trim(), 'i');
    if (maxPrice) filter.pricePerDay = { $lte: Number(maxPrice) };
    if (carType) filter.carType = new RegExp(String(carType).trim(), 'i');
    if (q) {
      filter.$or = [
        { name: new RegExp(String(q), 'i') },
        { model: new RegExp(String(q), 'i') },
        { description: new RegExp(String(q), 'i') },
      ];
    }
    const cars = await Car.find(filter).populate('ownerId', 'name email').sort({ createdAt: -1 }).lean();
    const base = `${req.protocol}://${req.get('host')}`;
    const mapped = cars.map((c) => ({
      ...c,
      images: (c.images || []).map((img) => (img.startsWith('http') ? img : `${base}/uploads/${path.basename(img)}`)),
    }));
    res.json({ cars: mapped });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list cars' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate('ownerId', 'name email').lean();
    if (!car) return res.status(404).json({ error: 'Car not found' });
    const base = `${req.protocol}://${req.get('host')}`;
    car.images = (car.images || []).map((img) => (img.startsWith('http') ? img : `${base}/uploads/${path.basename(img)}`));
    res.json({ car });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

/** Owner CRUD */
router.post('/', auth(true), requireRole('owner', 'admin'), upload.array('images', 12), async (req, res) => {
  try {
    const { name, model, year, pricePerDay, location, carType, description } = req.body;
    if (!name || !model || !year || !pricePerDay || !location || !carType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const ownerId = req.user.role === 'admin' ? req.body.ownerId || req.user.sub : req.user.sub;
    const files = req.files || [];
    const images = files.map((f) => f.filename);
    const car = await Car.create({
      ownerId,
      name,
      model,
      year: Number(year),
      pricePerDay: Number(pricePerDay),
      location,
      carType,
      description: description || '',
      images,
    });
    const populated = await Car.findById(car._id).populate('ownerId', 'name email').lean();
    const base = `${req.protocol}://${req.get('host')}`;
    populated.images = (populated.images || []).map((img) => `${base}/uploads/${path.basename(img)}`);
    res.status(201).json({ car: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'Failed to create car' });
  }
});

router.put('/:id', auth(true), requireRole('owner', 'admin'), upload.array('images', 12), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && car.ownerId.toString() !== req.user.sub) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, model, year, pricePerDay, location, carType, description, isActive, keepImages } = req.body;
    if (name) car.name = name;
    if (model) car.model = model;
    if (year) car.year = Number(year);
    if (pricePerDay !== undefined) car.pricePerDay = Number(pricePerDay);
    if (location) car.location = location;
    if (carType) car.carType = carType;
    if (description !== undefined) car.description = description;
    if (isActive !== undefined) car.isActive = isActive === 'true' || isActive === true;

    const newFiles = req.files || [];
    if (newFiles.length) {
      let existing = [];
      try {
        existing = keepImages ? JSON.parse(keepImages) : [];
      } catch {
        existing = [];
      }
      const kept = (car.images || []).filter((img) => existing.includes(img));
      const added = newFiles.map((f) => f.filename);
      car.images = [...kept, ...added];
    }

    await car.save();
    const populated = await Car.findById(car._id).populate('ownerId', 'name email').lean();
    const base = `${req.protocol}://${req.get('host')}`;
    populated.images = (populated.images || []).map((img) => `${base}/uploads/${path.basename(img)}`);
    res.json({ car: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update' });
  }
});

router.delete('/:id', auth(true), requireRole('owner', 'admin'), async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ error: 'Not found' });
    if (req.user.role !== 'admin' && car.ownerId.toString() !== req.user.sub) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await Car.deleteOne({ _id: car._id });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
