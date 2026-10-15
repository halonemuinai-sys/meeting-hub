const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'mra_meeting_room_secret_token_key_2026_super_secure';
const JWT_EXPIRES_IN = '7d';

/**
 * POST /api/auth/login
 * Validates email and password, generates JWT session token
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user in database
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        company: {
          select: { id: true, code: true, name: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Email is not registered in MRA Meeting Room System.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact MRA IT & General Affairs.'
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify your credentials.'
      });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(() => {});

    // Generate JWT token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Error in auth login:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication: ' + error.message
    });
  }
}

/**
 * GET /api/auth/me
 * Retrieves profile of currently authenticated user via Bearer token
 */
async function getMe(req, res) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required.'
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session token.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        company: {
          select: { id: true, code: true, name: true }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or deactivated.'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        company: user.company,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Error in auth getMe:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.'
    });
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  return res.json({
    success: true,
    message: 'Successfully logged out from MRA Meeting Room Booking System.'
  });
}

module.exports = {
  login,
  getMe,
  logout
};
