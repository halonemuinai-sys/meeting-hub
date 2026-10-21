const prisma = require('../config/db');

async function getAmenities(req, res) {
  try {
    const { category, search } = req.query;
    const where = {};

    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const amenities = await prisma.amenity.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    // Also get count of rooms using each amenity
    const allRooms = await prisma.room.findMany({
      select: { id: true, name: true, amenities: true }
    });

    const formatted = amenities.map(a => {
      const assignedRooms = allRooms.filter(r => {
        try {
          const list = r.amenities ? JSON.parse(r.amenities) : [];
          return list.includes(a.name);
        } catch {
          return false;
        }
      }).map(r => r.name);

      return {
        ...a,
        roomsCount: assignedRooms.length,
        assignedRooms
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error('getAmenities error:', err);
    res.status(500).json({ success: false, message: 'Gagal memuat master fasilitas.' });
  }
}

async function createAmenity(req, res) {
  try {
    const { name, category, description, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Nama fasilitas wajib diisi.' });
    }

    const existing = await prisma.amenity.findUnique({
      where: { name: name.trim() }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Fasilitas dengan nama ini sudah ada.' });
    }

    const amenity = await prisma.amenity.create({
      data: {
        name: name.trim(),
        category: category || 'GENERAL',
        description: description ? description.trim() : null,
        icon: icon || 'Sparkles'
      }
    });

    res.status(201).json({ success: true, message: 'Fasilitas berhasil ditambahkan.', data: amenity });
  } catch (err) {
    console.error('createAmenity error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan fasilitas.' });
  }
}

async function updateAmenity(req, res) {
  try {
    const { id } = req.params;
    const { name, category, description, icon, isActive } = req.body;

    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description.trim();
    if (icon !== undefined) data.icon = icon;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.amenity.update({
      where: { id },
      data
    });

    res.json({ success: true, message: 'Fasilitas berhasil diperbarui.', data: updated });
  } catch (err) {
    console.error('updateAmenity error:', err);
    res.status(500).json({ success: false, message: 'Gagal memperbarui fasilitas.' });
  }
}

async function deleteAmenity(req, res) {
  try {
    const { id } = req.params;
    await prisma.amenity.delete({ where: { id } });
    res.json({ success: true, message: 'Fasilitas berhasil dihapus.' });
  } catch (err) {
    console.error('deleteAmenity error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus fasilitas.' });
  }
}

async function deleteAllAmenities(req, res) {
  try {
    const clearRooms = req.query.clearRooms === 'true' || req.body?.clearRooms === true;

    const result = await prisma.amenity.deleteMany({});

    let roomsUpdated = 0;
    if (clearRooms) {
      const roomRes = await prisma.room.updateMany({
        data: { amenities: '[]' }
      });
      roomsUpdated = roomRes.count;
    }

    res.json({
      success: true,
      message: `Semua fasilitas (${result.count} item) berhasil dihapus.${roomsUpdated > 0 ? ` Fasilitas di ${roomsUpdated} ruangan juga telah dibersihkan.` : ''}`,
      count: result.count,
      roomsUpdated
    });
  } catch (err) {
    console.error('deleteAllAmenities error:', err);
    res.status(500).json({ success: false, message: 'Gagal menghapus semua fasilitas.' });
  }
}

module.exports = {
  getAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  deleteAllAmenities
};
