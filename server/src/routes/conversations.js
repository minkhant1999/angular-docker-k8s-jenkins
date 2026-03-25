const express = require('express');
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Car = require('../models/Car');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

/** Start or get conversation about a car (customer contacts owner) */
router.post('/', auth(true), async (req, res) => {
  try {
    const { carId } = req.body;
    if (!carId) return res.status(400).json({ error: 'carId required' });
    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ error: 'Car not found' });

    const ownerId = car.ownerId.toString();
    const me = req.user.sub;

    if (me === ownerId && req.user.role === 'owner') {
      return res.status(400).json({ error: 'Cannot chat with yourself' });
    }

    const other =
      req.user.role === 'owner'
        ? null
        : ownerId;

    let participants;
    if (req.user.role === 'customer') {
      participants = [new mongoose.Types.ObjectId(me), new mongoose.Types.ObjectId(ownerId)].sort((a, b) =>
        a.toString().localeCompare(b.toString())
      );
    } else {
      return res.status(400).json({ error: 'Owners open chats from customer side or use conversation list' });
    }

    let convo = await Conversation.findOne({
      carId: car._id,
      participants: { $all: participants, $size: 2 },
    });

    if (!convo) {
      convo = await Conversation.create({
        participants,
        carId: car._id,
        lastMessageAt: new Date(),
      });
    }

    const populated = await Conversation.findById(convo._id)
      .populate('participants', 'name email role isOnline lastSeenAt')
      .populate('carId', 'name model images')
      .lean();

    res.json({ conversation: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

/** List my conversations */
router.get('/', auth(true), async (req, res) => {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.sub);
    const list = await Conversation.find({ participants: uid })
      .populate('participants', 'name email role isOnline lastSeenAt')
      .populate('carId', 'name model images')
      .sort({ lastMessageAt: -1 })
      .lean();
    res.json({ conversations: list });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/:id/messages', auth(true), async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Not found' });
    if (!convo.participants.map((p) => p.toString()).includes(req.user.sub)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const messages = await Message.find({ conversationId: convo._id })
      .populate('senderId', 'name email role')
      .sort({ createdAt: 1 })
      .lean();
    res.json({ messages });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/:id/messages', auth(true), async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text required' });
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ error: 'Not found' });
    if (!convo.participants.map((p) => p.toString()).includes(req.user.sub)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const msg = await Message.create({
      conversationId: convo._id,
      senderId: req.user.sub,
      text: String(text).trim(),
    });
    convo.lastMessageAt = new Date();
    await convo.save();
    const populated = await Message.findById(msg._id).populate('senderId', 'name email role').lean();
    res.status(201).json({ message: populated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed' });
  }
});

module.exports = router;
