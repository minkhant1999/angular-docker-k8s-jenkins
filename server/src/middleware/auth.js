const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function auth(required = true) {
  return (req, res, next) => {
    const h = req.headers.authorization;
    if (!h || !h.startsWith('Bearer ')) {
      if (!required) return next();
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = h.slice(7);
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}

function optionalAuth() {
  return auth(false);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { auth, optionalAuth, requireRole, signToken, JWT_SECRET };
