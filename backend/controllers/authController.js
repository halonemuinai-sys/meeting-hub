const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { sendPasswordResetEmail } = require('../services/mailService');

const JWT_SECRET = process.env.JWT_SECRET || 'mra_meeting_room_secret_token_key_2026_super_secure';
const JWT_EXPIRES_IN = '7d';

// Temporary in-memory store for OTP verification codes
// Map<email, { code: string, expiresAt: number, verified: boolean }>
const passwordResetCache = new Map();

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

/**
 * POST /api/auth/forgot-password
 * Initiates password reset by issuing a 6-digit OTP code and sending email notification
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your registered work email.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email address is not registered in MRA Meeting Hub.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account is currently deactivated. Please contact MRA IT / GA.'
      });
    }

    // Generate random 6-digit numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Store in temporary cache
    passwordResetCache.set(normalizedEmail, {
      code: otpCode,
      expiresAt,
      verified: false
    });

    // Create signed reset token for direct link
    const resetToken = jwt.sign(
      { email: normalizedEmail, code: otpCode, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const appUrl = process.env.APP_URL || 'http://localhost:3007';
    const directResetLink = `${appUrl}/forgot-password?email=${encodeURIComponent(normalizedEmail)}&code=${otpCode}&token=${resetToken}`;

    // Send corporate notification email asynchronously
    sendPasswordResetEmail(user, otpCode, directResetLink).catch(err => {
      console.error('Async mail error on forgot password:', err);
    });

    return res.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}.`,
      resetToken
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process password reset request.'
    });
  }
}

/**
 * POST /api/auth/verify-reset-code
 * Verifies that the entered 6-digit code matches and is still valid
 */
async function verifyResetCode(req, res) {
  try {
    const { email, code, token } = req.body;
    if (!email || (!code && !token)) {
      return res.status(400).json({
        success: false,
        message: 'Email and 6-digit verification code are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Verify token if supplied directly
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.email === normalizedEmail && decoded.type === 'password_reset') {
          const cached = passwordResetCache.get(normalizedEmail) || { expiresAt: Date.now() + 600000 };
          cached.verified = true;
          passwordResetCache.set(normalizedEmail, cached);
          return res.json({
            success: true,
            message: 'Verification code confirmed. You may now enter your new password.'
          });
        }
      } catch (err) {
        // Fall back to cache check
      }
    }

    const cached = passwordResetCache.get(normalizedEmail);
    if (!cached) {
      return res.status(400).json({
        success: false,
        message: 'No active password reset request found for this email. Please request a new code.'
      });
    }

    if (Date.now() > cached.expiresAt) {
      passwordResetCache.delete(normalizedEmail);
      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new code.'
      });
    }

    if (cached.code !== String(code).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect verification code. Please check your email and try again.'
      });
    }

    cached.verified = true;
    passwordResetCache.set(normalizedEmail, cached);

    return res.json({
      success: true,
      message: 'Verification code confirmed. You may now enter your new password.'
    });
  } catch (error) {
    console.error('Error in verifyResetCode:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify reset code.'
    });
  }
}

/**
 * POST /api/auth/reset-password
 * Updates the user's password in the database
 */
async function resetPassword(req, res) {
  try {
    const { email, code, newPassword, token } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email and new password are required.'
      });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let isAuthorized = false;

    // Check token if provided
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.email === normalizedEmail && decoded.type === 'password_reset') {
          isAuthorized = true;
        }
      } catch (e) {
        // Continue to check cache
      }
    }

    if (!isAuthorized) {
      const cached = passwordResetCache.get(normalizedEmail);
      if (!cached) {
        return res.status(400).json({
          success: false,
          message: 'Reset session expired or invalid. Please request a new code.'
        });
      }

      if (Date.now() > cached.expiresAt) {
        passwordResetCache.delete(normalizedEmail);
        return res.status(400).json({
          success: false,
          message: 'Verification code has expired. Please request a new code.'
        });
      }

      if (code && cached.code !== String(code).trim()) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect verification code.'
        });
      }

      if (!cached.verified && (!code || cached.code !== String(code).trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your code first.'
        });
      }

      isAuthorized = true;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update in database
    await prisma.user.update({
      where: { email: normalizedEmail },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Invalidate reset session
    passwordResetCache.delete(normalizedEmail);

    return res.json({
      success: true,
      message: 'Password has been successfully updated. You may now sign in with your new credentials.'
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reset password.'
    });
  }
}

module.exports = {
  login,
  getMe,
  logout,
  forgotPassword,
  verifyResetCode,
  resetPassword
};

