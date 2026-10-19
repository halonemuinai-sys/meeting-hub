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

/**
 * Helper to infer reasonable name & corporate entity defaults from email
 */
function inferNameAndEntityFromEmail(rawEmail, companies) {
  const email = rawEmail.trim().toLowerCase();
  const [handle, domain] = email.split('@');

  // Format handle to Title Case Name (e.g. "budi.santoso" -> "Budi Santoso", "clarissa_wijaya" -> "Clarissa Wijaya")
  const rawParts = (handle || 'New Attendee').split(/[._\-+]/).filter(Boolean);
  const fullName = rawParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ') || 'New Attendee';

  // Find matching company by domain
  let matchedCompany = null;
  if (domain) {
    if (domain.includes('mogems')) {
      matchedCompany = companies.find(c => c.code === 'MOGEMS');
    } else if (domain.includes('media') || domain.includes('mramedia')) {
      matchedCompany = companies.find(c => c.code === 'MRA_MEDIA');
    } else if (domain.includes('mra')) {
      matchedCompany = companies.find(c => c.code === 'MRA_HOLDING');
    }
  }

  // Fallback to first company (MRA Holding)
  const defaultCompany = matchedCompany || companies[0];

  return {
    email,
    fullName,
    companyId: defaultCompany?.id,
    companyName: defaultCompany?.name,
    department: 'Pending Admin Review',
    jobTitle: 'Meeting Attendee'
  };
}

/**
 * Quick Add Attendees by Email Only
 * Accepts single email or array of emails. Smartly registers to database so Admin can refine later.
 */
async function quickAddAttendee(req, res) {
  try {
    const { email, emails } = req.body;
    const rawList = Array.isArray(emails) ? emails : [email];
    const sanitizedEmails = rawList
      .map(e => String(e || '').trim().toLowerCase())
      .filter(e => e && e.includes('@'));

    if (sanitizedEmails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one valid work email address.'
      });
    }

    const companies = await prisma.company.findMany();
    if (companies.length === 0) {
      return res.status(500).json({ success: false, message: 'No company entities found.' });
    }

    const results = [];
    for (const em of sanitizedEmails) {
      const existing = await prisma.attendee.findUnique({
        where: { email: em },
        include: { company: true }
      });

      if (existing) {
        results.push({ ...existing, isExisting: true });
        continue;
      }

      const inferred = inferNameAndEntityFromEmail(em, companies);
      const created = await prisma.attendee.create({
        data: {
          fullName: inferred.fullName,
          email: inferred.email,
          companyId: inferred.companyId,
          department: inferred.department,
          jobTitle: inferred.jobTitle,
          phone: null
        },
        include: { company: true }
      });
      results.push({ ...created, isExisting: false, isPendingReview: true });
    }

    const newlyAdded = results.filter(r => !r.isExisting);
    const countNew = newlyAdded.length;

    return res.status(201).json({
      success: true,
      message: countNew > 0
        ? `${countNew} new attendee(s) successfully added by email. Admin can refine company & department details later.`
        : 'All provided emails are already registered in the directory.',
      data: results,
      newlyAdded
    });
  } catch (err) {
    console.error('quickAddAttendee error:', err);
    return res.status(500).json({ success: false, message: 'Failed to quick add attendee: ' + err.message });
  }
}

module.exports = {
  getAttendees,
  createAttendee,
  updateAttendee,
  deleteAttendee,
  quickAddAttendee,
  inferNameAndEntityFromEmail
};

