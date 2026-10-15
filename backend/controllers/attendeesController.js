const prisma = require('../config/db');

async function getAttendees(req, res) {
  try {
    const { companyId, department, search } = req.query;
    const where = {};

    if (companyId) where.companyId = companyId;
    if (department) where.department = department;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { department: { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } }
      ];
    }

    const attendees = await prisma.attendee.findMany({
      where,
      include: { company: true },
      orderBy: [{ company: { name: 'asc' } }, { fullName: 'asc' }]
    });

    res.json({ success: true, data: attendees });
  } catch (err) {
    console.error('getAttendees error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat master peserta.' });
  }
}

async function createAttendee(req, res) {
  try {
    const { fullName, email, companyId, department, jobTitle, phone } = req.body;

    if (!fullName || !email || !companyId || !department) {
      return res.status(400).json({
        success: false,
        message: 'Nama lengkap, email, entitas, dan departemen wajib diisi.'
      });
    }

    const existing = await prisma.attendee.findUnique({
      where: { email: email.trim().toLowerCase() }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Peserta dengan email ini sudah terdaftar.' });
    }

    const attendee = await prisma.attendee.create({
      data: {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        companyId,
        department: department.trim(),
        jobTitle: jobTitle ? jobTitle.trim() : null,
        phone: phone ? phone.trim() : null
      },
      include: { company: true }
    });

    res.status(201).json({ success: true, message: 'Data peserta berhasil ditambahkan.', data: attendee });
  } catch (err) {
    console.error('createAttendee error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan peserta.' });
  }
}

async function updateAttendee(req, res) {
  try {
    const { id } = req.params;
    const { fullName, email, companyId, department, jobTitle, phone, isActive } = req.body;

    const data = {};
    if (fullName !== undefined) data.fullName = fullName.trim();
    if (email !== undefined) data.email = email.trim().toLowerCase();
    if (companyId !== undefined) data.companyId = companyId;
    if (department !== undefined) data.department = department.trim();
    if (jobTitle !== undefined) data.jobTitle = jobTitle.trim();
    if (phone !== undefined) data.phone = phone.trim();
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.attendee.update({
      where: { id },
      data,
      include: { company: true }
    });

    res.json({ success: true, message: 'Data peserta berhasil diperbarui.', data: updated });
  } catch (err) {
    console.error('updateAttendee error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data peserta.' });
  }
}

async function deleteAttendee(req, res) {
  try {
    const { id } = req.params;
    await prisma.attendee.delete({ where: { id } });
    res.json({ success: true, message: 'Peserta berhasil dihapus.' });
  } catch (err) {
    console.error('deleteAttendee error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus peserta.' });
  }
}

module.exports = {
  getAttendees,
  createAttendee,
  updateAttendee,
  deleteAttendee
};
