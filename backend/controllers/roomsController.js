const prisma = require('../config/db');

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function parseAmenities(raw) {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }
}

function serializeAmenities(amenities) {
  if (Array.isArray(amenities)) {
    return JSON.stringify(amenities.map(a => String(a).trim()).filter(Boolean));
  }
  if (typeof amenities === 'string') {
    return JSON.stringify(amenities.split(',').map(a => a.trim()).filter(Boolean));
  }
  return '[]';
}

function formatRoom(r) {
  const { _count, ...room } = r;
  return {
    ...room,
    amenities: parseAmenities(r.amenities),
    ...(_count ? { totalBookingsCount: _count.bookings } : {})
  };
}

/**
 * Validates room fields shared by create and update.
 * Returns { errors, data } where data only contains the fields that were provided.
 */
function validateRoomInput(body, { requireAll }) {
  const errors = [];
  const data = {};

  if (body.companyId !== undefined || requireAll) {
    if (!body.companyId) errors.push('Entity (company) is required.');
    else data.companyId = body.companyId;
  }
  if (body.name !== undefined || requireAll) {
    const name = String(body.name || '').trim();
    if (!name) errors.push('Room name is required.');
    else data.name = name;
  }
  if (body.floor !== undefined) {
    data.floor = String(body.floor || '').trim() || null;
  }

  const min = body.capacityMin !== undefined ? parseInt(body.capacityMin, 10) : undefined;
  const max = body.capacityMax !== undefined ? parseInt(body.capacityMax, 10) : undefined;
  if (min !== undefined) {
    if (!Number.isInteger(min) || min < 1) errors.push('Minimum capacity must be at least 1.');
    else data.capacityMin = min;
  }
  if (max !== undefined || requireAll) {
    if (!Number.isInteger(max) || max < 1) errors.push('Maximum capacity must be at least 1.');
    else data.capacityMax = max;
  }
  if (data.capacityMin !== undefined && data.capacityMax !== undefined && data.capacityMin > data.capacityMax) {
    errors.push('Minimum capacity cannot exceed maximum capacity.');
  }

  if (body.colorCode !== undefined) {
    if (!HEX_COLOR.test(body.colorCode)) errors.push('Color must be a hex value such as #2563eb.');
    else data.colorCode = body.colorCode;
  }
  if (body.amenities !== undefined) data.amenities = serializeAmenities(body.amenities);
  if (body.isMaintenance !== undefined) data.isMaintenance = Boolean(body.isMaintenance);
  if (body.maintenanceNote !== undefined) data.maintenanceNote = String(body.maintenanceNote || '').trim() || null;
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  return { errors, data };
}

async function findDuplicateName(companyId, name, excludeId) {
  return prisma.room.findFirst({
    where: {
      companyId,
      name: { equals: name, mode: 'insensitive' },
      ...(excludeId ? { id: { not: excludeId } } : {})
    }
  });
}

/**
 * GET /api/rooms
 * Returns active rooms only, unless ?includeInactive=true (used by the room management page).
 */
async function getRooms(req, res) {
  try {
    const { companyId, includeInactive } = req.query;

    const where = {};
    if (companyId) where.companyId = companyId;
    if (includeInactive !== 'true') where.isActive = true;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        company: true,
        _count: { select: { bookings: true } },
        bookings: {
          where: { status: 'CONFIRMED', endTime: { gte: new Date() } },
          select: { id: true }
        }
      },
      orderBy: [{ company: { name: 'asc' } }, { name: 'asc' }]
    });

    const formatted = rooms.map(({ bookings, ...r }) => ({
      ...formatRoom(r),
      activeBookingsCount: bookings.length
    }));

    return res.json({ success: true, data: formatted });
  } catch (error) {
    console.error('getRooms error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load rooms.' });
  }
}

/**
 * GET /api/rooms/:id
 */
async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        company: true,
        bookings: {
          where: { status: 'CONFIRMED', endTime: { gte: new Date() } },
          orderBy: { startTime: 'asc' },
          take: 10
        }
      }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    return res.json({ success: true, data: formatRoom(room) });
  } catch (error) {
    console.error('getRoomById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load room details.' });
  }
}

/**
 * POST /api/rooms
 */
async function createRoom(req, res) {
  try {
    const { errors, data } = validateRoomInput(req.body, { requireAll: true });
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const company = await prisma.company.findUnique({ where: { id: data.companyId } });
    if (!company) {
      return res.status(400).json({ success: false, message: 'Selected entity does not exist.' });
    }
    if (await findDuplicateName(data.companyId, data.name)) {
      return res.status(409).json({ success: false, message: `A room named "${data.name}" already exists for ${company.name}.` });
    }

    const created = await prisma.room.create({
      data: { amenities: '[]', ...data },
      include: { company: true }
    });

    return res.status(201).json({
      success: true,
      message: `${created.name} has been added.`,
      data: formatRoom(created)
    });
  } catch (error) {
    console.error('createRoom error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create room.' });
  }
}

/**
 * PATCH /api/rooms/:id/amenities
 */
async function updateRoomAmenities(req, res) {
  try {
    const { id } = req.params;
    const updated = await prisma.room.update({
      where: { id },
      data: { amenities: serializeAmenities(req.body.amenities) },
      include: { company: true }
    });

    return res.json({
      success: true,
      message: 'Room amenities updated.',
      data: formatRoom(updated)
    });
  } catch (error) {
    console.error('updateRoomAmenities error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update room amenities.' });
  }
}

/**
 * PUT /api/rooms/:id
 */
async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const existing = await prisma.room.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }

    const { errors, data } = validateRoomInput(req.body, { requireAll: false });
    const min = data.capacityMin ?? existing.capacityMin;
    const max = data.capacityMax ?? existing.capacityMax;
    if (!errors.length && min > max) errors.push('Minimum capacity cannot exceed maximum capacity.');
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors[0], errors });
    }

    const companyId = data.companyId || existing.companyId;
    const name = data.name || existing.name;
    if ((data.name || data.companyId) && (await findDuplicateName(companyId, name, id))) {
      return res.status(409).json({ success: false, message: `A room named "${name}" already exists for this entity.` });
    }

    const updated = await prisma.room.update({
      where: { id },
      data,
      include: { company: true }
    });

    let message = `${updated.name} has been updated.`;
    if (data.isActive === false) message = `${updated.name} has been deactivated.`;
    if (data.isActive === true && !existing.isActive) message = `${updated.name} has been reactivated.`;

    return res.json({ success: true, message, data: formatRoom(updated) });
  } catch (error) {
    console.error('updateRoom error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update room.' });
  }
}

/**
 * DELETE /api/rooms/:id
 * Only rooms without any booking history can be deleted; otherwise deactivate them.
 */
async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } }
    });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found.' });
    }
    if (room._count.bookings > 0) {
      return res.status(409).json({
        success: false,
        message: 'This room has booking history and cannot be deleted. Deactivate it instead.'
      });
    }

    await prisma.room.delete({ where: { id } });
    return res.json({ success: true, message: `${room.name} has been deleted.` });
  } catch (error) {
    console.error('deleteRoom error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete room.' });
  }
}

module.exports = {
  getRooms,
  getRoomById,
  createRoom,
  updateRoomAmenities,
  updateRoom,
  deleteRoom
};
