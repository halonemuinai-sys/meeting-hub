const prisma = require('../config/db');

/**
 * Get all rooms with optional company filter
 */
async function getRooms(req, res) {
  try {
    const { companyId, isActive } = req.query;

    const where = {};
    if (companyId) where.companyId = companyId;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const rooms = await prisma.room.findMany({
      where,
      include: {
        company: true,
        _count: {
          select: {
            bookings: {
              where: {
                status: 'CONFIRMED',
                endTime: { gte: new Date() }
              }
            }
          }
        }
      },
      orderBy: [
        { company: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    const formatted = rooms.map(r => {
      let parsedAmenities = [];
      try {
        parsedAmenities = r.amenities ? JSON.parse(r.amenities) : [];
      } catch {
        parsedAmenities = r.amenities ? r.amenities.split(',').map(s => s.trim()) : [];
      }
      return {
        ...r,
        amenities: parsedAmenities,
        activeBookingsCount: r._count.bookings
      };
    });

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('getRooms error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data ruangan.' });
  }
}

/**
 * Get room detail by ID
 */
async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        company: true,
        bookings: {
          where: {
            status: 'CONFIRMED',
            endTime: { gte: new Date() }
          },
          orderBy: { startTime: 'asc' },
          take: 10
        }
      }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan.' });
    }

    let parsedAmenities = [];
    try {
      parsedAmenities = room.amenities ? JSON.parse(room.amenities) : [];
    } catch {
      parsedAmenities = room.amenities ? room.amenities.split(',').map(s => s.trim()) : [];
    }

    return res.json({
      success: true,
      data: {
        ...room,
        amenities: parsedAmenities
      }
    });
  } catch (error) {
    console.error('getRoomById error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail ruangan.' });
  }
}

/**
 * Update room amenities by GA (General Affairs)
 */
async function updateRoomAmenities(req, res) {
  try {
    const { id } = req.params;
    const { amenities } = req.body; // Can be array of strings or comma-separated string

    let amenitiesJson = '[]';
    if (Array.isArray(amenities)) {
      amenitiesJson = JSON.stringify(amenities.map(a => String(a).trim()).filter(Boolean));
    } else if (typeof amenities === 'string') {
      const items = amenities.split(',').map(a => a.trim()).filter(Boolean);
      amenitiesJson = JSON.stringify(items);
    }

    const updated = await prisma.room.update({
      where: { id },
      data: { amenities: amenitiesJson },
      include: { company: true }
    });

    return res.json({
      success: true,
      message: 'Fasilitas ruangan berhasil diperbarui.',
      data: {
        ...updated,
        amenities: JSON.parse(updated.amenities || '[]')
      }
    });
  } catch (error) {
    console.error('updateRoomAmenities error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui fasilitas ruangan.' });
  }
}

/**
 * Update room details (capacity, maintenance mode, etc.) by GA / Admin
 */
async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const { name, floor, capacityMin, capacityMax, colorCode, isMaintenance, maintenanceNote, isActive, amenities } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (floor !== undefined) data.floor = floor;
    if (capacityMin !== undefined) data.capacityMin = parseInt(capacityMin, 10);
    if (capacityMax !== undefined) data.capacityMax = parseInt(capacityMax, 10);
    if (colorCode !== undefined) data.colorCode = colorCode;
    if (isMaintenance !== undefined) data.isMaintenance = Boolean(isMaintenance);
    if (maintenanceNote !== undefined) data.maintenanceNote = maintenanceNote;
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    if (amenities !== undefined) {
      if (Array.isArray(amenities)) {
        data.amenities = JSON.stringify(amenities.map(a => String(a).trim()).filter(Boolean));
      } else if (typeof amenities === 'string') {
        data.amenities = JSON.stringify(amenities.split(',').map(a => a.trim()).filter(Boolean));
      }
    }

    const updated = await prisma.room.update({
      where: { id },
      data,
      include: { company: true }
    });

    return res.json({
      success: true,
      message: 'Data ruangan berhasil diperbarui.',
      data: {
        ...updated,
        amenities: JSON.parse(updated.amenities || '[]')
      }
    });
  } catch (error) {
    console.error('updateRoom error:', error);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui ruangan.' });
  }
}

module.exports = {
  getRooms,
  getRoomById,
  updateRoomAmenities,
  updateRoom
};
