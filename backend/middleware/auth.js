const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mra_meeting_room_secret_token_key_2026_super_secure';

const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  GA_ADMIN: 'GA_ADMIN',
  USER: 'USER'
};

// Roles allowed to manage rooms, amenities and the attendee directory
const FACILITY_ROLES = [ROLES.SUPER_ADMIN, ROLES.GA_ADMIN];

/**
 * Resolves the Bearer token to the current, active user record.
 * Role and active status are read from the database so changes take effect immediately.
 */
async function resolveUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  let decoded;
  try {
    decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, email: true, name: true, role: true, department: true, isActive: true }
  });

  return user && user.isActive ? user : null;
}

/**
 * Attaches req.user when a valid token is present, but never blocks the request.
 */
async function optionalAuth(req, res, next) {
  try {
    req.user = await resolveUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Blocks the request with 401 unless a valid session token is present.
 */
async function requireAuth(req, res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please sign in to continue.'
      });
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Blocks the request with 403 unless the signed-in user has one of the given roles.
 * Must run after requireAuth.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action.'
      });
    }
    next();
  };
}

module.exports = {
  ROLES,
  FACILITY_ROLES,
  optionalAuth,
  requireAuth,
  requireRole
};
