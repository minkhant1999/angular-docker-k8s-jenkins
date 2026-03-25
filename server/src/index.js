require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const bookingsRoutes = require('./routes/bookings');
const conversationsRoutes = require('./routes/conversations');
const adminRoutes = require('./routes/admin');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const User = require('./models/User');
const { JWT_SECRET } = require('./middleware/auth');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/car-rental';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:4200';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN.split(',').map((s) => s.trim()), methods: ['GET', 'POST'] },
});

app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/admin', adminRoutes);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Unauthorized'));
    const payload = jwt.verify(token, JWT_SECRET);
    socket.userId = payload.sub;
    socket.userRole = payload.role;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', async (socket) => {
  const userId = socket.userId;
  socket.join(`user:${userId}`);
  await User.findByIdAndUpdate(userId, { isOnline: true, lastSeenAt: new Date() });
  io.emit('presence', { userId, isOnline: true });

  socket.on('join_conversation', async (conversationId, cb) => {
    try {
      const convo = await Conversation.findById(conversationId);
      if (!convo || !convo.participants.map((p) => p.toString()).includes(userId)) {
        return cb?.({ error: 'Forbidden' });
      }
      socket.join(`convo:${conversationId}`);
      cb?.({ ok: true });
    } catch (e) {
      cb?.({ error: String(e.message) });
    }
  });

  socket.on(
    'message',
    async (payload, cb) => {
      try {
        const { conversationId, text } = payload || {};
        if (!conversationId || !text || !String(text).trim()) {
          return cb?.({ error: 'conversationId and text required' });
        }
        const convo = await Conversation.findById(conversationId);
        if (!convo || !convo.participants.map((p) => p.toString()).includes(userId)) {
          return cb?.({ error: 'Forbidden' });
        }
        const msg = await Message.create({
          conversationId: convo._id,
          senderId: userId,
          text: String(text).trim(),
        });
        convo.lastMessageAt = new Date();
        await convo.save();
        const populated = await Message.findById(msg._id).populate('senderId', 'name email role').lean();
        io.to(`convo:${conversationId}`).emit('message', populated);
        cb?.({ ok: true, message: populated });
      } catch (e) {
        cb?.({ error: String(e.message) });
      }
    }
  );

  socket.on('disconnect', async () => {
    try {
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeenAt: new Date() });
      io.emit('presence', { userId, isOnline: false });
    } catch {
      /* ignore */
    }
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Server error' });
});

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    server.listen(PORT, () => console.log(`API + WS on http://localhost:${PORT}`));
  })
  .catch((e) => {
    console.error('MongoDB connection error', e);
    process.exit(1);
  });
