const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { ROLES } = require('../middleware/auth');

const VALID_ROLES = Object.values(ROLES);

// Never expose the password hash in API responses
function toPublicUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    companyId: u.companyId,
    companyName: u.company ? u.company.name : 'All Entities (Holding)',
    companyCode: u.company ? u.company.code : 'MRA_HOLDING',
    department: u.department || 'General',
    isActive: u.isActive,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt
  };
}

async function getUsers(req, res) {
  try {
    const { role, companyId, search } = req.query;
    const where = {};

    if (role) where.role = role;
    if (companyId) where.companyId = companyId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: { company: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    });

    res.json({ success: true, data: users.map(toPublicUser) });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, role, companyId, department, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, message: 'Name, email and role are required.' });
    }
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    if (!password || String(password).length < 8) {
      return res.status(400).json({ success: false, message: 'Initial password must be at least 8 characters.' });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists.' });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        companyId: companyId || null,
        department: department ? department.trim() : null,
        password: await bcrypt.hash(String(password), 10)
      },
      include: { company: true }
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: toPublicUser(newUser)
    });
  } catch (err) {
    console.error('createUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to create user.' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, companyId, department, isActive } = req.body;
    const isSelf = id === req.user.id;

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    // Prevent a Super Admin from locking themselves out
    if (isSelf && role !== undefined && role !== ROLES.SUPER_ADMIN) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }
    if (isSelf && isActive !== undefined && !isActive) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (email !== undefined) data.email = email.trim().toLowerCase();
    if (role !== undefined) data.role = role;
    if (companyId !== undefined) data.companyId = companyId || null;
    if (department !== undefined) data.department = department ? department.trim() : null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { company: true }
    });

    res.json({
      success: true,
      message: 'User updated successfully.',
      data: toPublicUser(updated)
    });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
