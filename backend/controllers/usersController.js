const prisma = require('../config/db');

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

    res.json({
      success: true,
      data: users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        companyId: u.companyId,
        companyName: u.company ? u.company.name : 'All Entitas (Holding)',
        companyCode: u.company ? u.company.code : 'MRA_HOLDING',
        department: u.department || 'General',
        isActive: u.isActive,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt
      }))
    });
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat data pengguna.' });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, role, companyId, department, password } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Nama, email, dan role wajib diisi.'
      });
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email pengguna sudah terdaftar.' });
    }

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role || 'USER',
        companyId: companyId || null,
        department: department ? department.trim() : null
      },
      include: { company: true }
    });

    res.status(201).json({
      success: true,
      message: 'Pengguna berhasil ditambahkan.',
      data: newUser
    });
  } catch (err) {
    console.error('createUser error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan pengguna.' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, role, companyId, department, isActive } = req.body;

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
      message: 'Data pengguna berhasil diperbarui.',
      data: updated
    });
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui pengguna.' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'Pengguna berhasil dihapus.' });
  } catch (err) {
    console.error('deleteUser error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus pengguna.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
