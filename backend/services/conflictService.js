const prisma = require('../config/db');

/**
 * Checks if a proposed booking interval clashes with any existing booking for the specified room.
 * Anti-collision algorithm:
 * Overlap occurs if: (existingStart < newEnd) AND (existingEnd > newStart)
 *
 * @param {string} roomId
 * @param {Date|string} startTime
 * @param {Date|string} endTime
 * @param {string|null} excludeBookingId
 * @returns {Promise<{ hasConflict: boolean, conflicts: Array }>}
 */
async function checkRoomConflict(roomId, startTime, endTime, excludeBookingId = null) {
  const start = new Date(startTime);
  const end = new Date(endTime);

  const whereClause = {
    roomId,
    status: 'CONFIRMED',
    AND: [
      { startTime: { lt: end } },
      { endTime: { gt: start } }
    ]
  };

  if (excludeBookingId) {
    whereClause.id = { not: excludeBookingId };
  }

  const conflicts = await prisma.booking.findMany({
    where: whereClause,
    include: {
      room: {
        include: {
          company: true
        }
      }
    },
    orderBy: { startTime: 'asc' }
  });

  return {
    hasConflict: conflicts.length > 0,
    conflicts
  };
}

/**
 * Sanitizes and validates booking input payload
 * @param {object} body
 * @returns {{ isValid: boolean, errors: string[], data: object }}
 */
function validateBookingInput(body = {}) {
  const errors = [];
  const title = String(body.title || '').trim();
  const roomId = String(body.roomId || '').trim();
  const organizerName = String(body.organizerName || '').trim();
  const organizerEmail = String(body.organizerEmail || '').trim().toLowerCase();
  const department = String(body.department || '').trim();

  if (!title) errors.push('Meeting title & agenda is required.');
  if (!roomId) errors.push('Meeting room selection is required.');
  if (!organizerName) errors.push('Host/organizer name is required.');
  if (!organizerEmail || !organizerEmail.includes('@')) errors.push('Valid corporate email is required.');
  if (!department) errors.push('Department is required.');

  const start = new Date(body.startTime);
  const end = new Date(body.endTime);

  if (isNaN(start.getTime())) errors.push('Invalid meeting start time.');
  if (isNaN(end.getTime())) errors.push('Invalid meeting end time.');

  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    if (end <= start) {
      errors.push('Meeting end time must be later than start time.');
    }
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 15) {
      errors.push('Meeting duration must be at least 15 minutes.');
    }
    if (durationMinutes > 600) {
      errors.push('Meeting duration cannot exceed 10 hours per booking.');
    }
  }

  // Parse attendees list
  let attendeeList = [];
  if (Array.isArray(body.attendees)) {
    attendeeList = body.attendees.map(a => String(a).trim().toLowerCase()).filter(a => a && a.includes('@'));
  } else if (typeof body.attendees === 'string' && body.attendees.trim()) {
    attendeeList = body.attendees
      .split(/[,;\n]/)
      .map(a => a.trim().toLowerCase())
      .filter(a => a && a.includes('@'));
  }

  const attendeesCount = parseInt(body.attendeesCount, 10) || Math.max(1, attendeeList.length + 1);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      title,
      roomId,
      description: String(body.description || '').trim() || null,
      organizerName,
      organizerEmail,
      department,
      attendees: JSON.stringify(attendeeList),
      attendeesCount,
      startTime: start,
      endTime: end,
      isConfidential: Boolean(body.isConfidential),
      category: String(body.category || 'General Meeting').trim() || 'General Meeting',
      specialRequests: String(body.specialRequests || '').trim() || null
    }
  };
}

module.exports = {
  checkRoomConflict,
  validateBookingInput
};
