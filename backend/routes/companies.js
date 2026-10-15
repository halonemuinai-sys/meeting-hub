const express = require('express');
const router = express.Router();
const prisma = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: { rooms: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: companies.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        roomsCount: c._count.rooms
      }))
    });
  } catch (err) {
    console.error('getCompanies error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat daftar entitas.' });
  }
});

module.exports = router;
