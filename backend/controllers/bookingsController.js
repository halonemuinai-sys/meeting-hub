const prisma = require('../config/db');
const { checkRoomConflict, validateBookingInput } = require('../services/conflictService');
const { sendBookingConfirmation, sendBookingCancellation } = require('../services/mailService');
const { inferNameAndEntityFromEmail } = require('./attendeesController');
const { ROLES } = require('../middleware/auth');

function isOrganizer(user, booking) {
  return Boolean(user && user.email && user.email.toLowerCase() === booking.organizerEmail.toLowerCase());
}

/**
 * Confidential meetings: only the organizer or a Super Admin may cancel.
 * Other meetings: the organizer, a GA Admin or a Super Admin may cancel.
 */
function canCancelBooking(user, booking) {
  if (!user) return false;
  if (user.role === ROLES.SUPER_ADMIN || isOrganizer(user, booking)) return true;
  return !booking.isConfidential && user.role === ROLES.GA_ADMIN;
}

/**
 * Get bookings for calendar views (with date range & filters)
 */
async function getBookings(req, res) {
  try {
    const { from, to, roomId, companyId, status, search, category } = req.query;

    // Bookings of deactivated rooms stay in the database but are hidden from the calendar
    const where = { room: { isActive: true } };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (companyId) {
      where.room.companyId = companyId;
    }

    if (from || to) {
      where.AND = where.AND || [];
      if (from) {
        where.AND.push({ endTime: { gte: new Date(from) } });
      }
      if (to) {
        where.AND.push({ startTime: { lte: new Date(to) } });
      }
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { organizerName: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } }
      ];
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          include: {
            company: true
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    const currentUser = req.user;

    // Format events for Frontend Calendar
    const events = bookings.map(b => {
      let attendeesList = [];
      try {
        attendeesList = b.attendees ? JSON.parse(b.attendees) : [];
      } catch {
        attendeesList = [];
      }

      const isConfidential = Boolean(b.isConfidential);
      const isCreator = isOrganizer(currentUser, b);
      const isSuperAdmin = Boolean(currentUser && currentUser.role === ROLES.SUPER_ADMIN);
      const canViewConfidential = !isConfidential || isCreator || isSuperAdmin;

      return {
        id: b.id,
        canCancel: b.status !== 'CANCELLED' && canCancelBooking(currentUser, b),
        title: canViewConfidential ? b.title : 'Private Meeting',
        description: canViewConfidential ? b.description : 'Details are visible only to the organizer.',
        start: b.startTime.toISOString(),
        end: b.endTime.toISOString(),
        roomId: b.roomId,
        roomName: b.room.name,
        roomFloor: b.room.floor,
        companyId: b.room.companyId,
        companyName: b.room.company.name,
        companyCode: b.room.company.code,
        colorCode: isConfidential && !canViewConfidential ? '#64748b' : b.room.colorCode,
        organizerName: canViewConfidential ? b.organizerName : 'Private Organizer',
        organizerEmail: canViewConfidential ? b.organizerEmail : null,
        department: canViewConfidential ? b.department : 'Confidential',
        attendees: canViewConfidential ? attendeesList : [],
        attendeesCount: b.attendeesCount,
        status: b.status,
        specialRequests: canViewConfidential ? b.specialRequests : null,
        cancelReason: b.cancelReason,
        isConfidential,
        canViewConfidential,
        isCreator,
        category: b.category || 'General Meeting',
        createdAt: b.createdAt
      };
    });

    return res.json({
      success: true,
      data: {
        events,
        count: events.length
      }
    });
  } catch (error) {
    console.error('getBookings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve bookings.' });
  }
}

/**
 * Pre-check availability for a time slot
 */
async function checkAvailability(req, res) {
  try {
    const { roomId, startTime, endTime, excludeBookingId } = req.body;

    if (!roomId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'roomId, startTime, and endTime are required.'
      });
    }

    const { hasConflict, conflicts } = await checkRoomConflict(roomId, startTime, endTime, excludeBookingId);

    return res.json({
      success: true,
      isAvailable: !hasConflict,
      conflicts: conflicts.map(c => ({
        id: c.id,
        title: c.title,
        organizerName: c.organizerName,
        startTime: c.startTime,
        endTime: c.endTime
      }))
    });
  } catch (error) {
    console.error('checkAvailability error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check room availability.' });
  }
}

/**
 * Create a new meeting room booking
 */
async function createBooking(req, res) {
  try {
    const input = { ...req.body };
    // Employees always book under their own identity; admins may book on behalf of others
    if (req.user.role === ROLES.USER) {
      input.organizerName = req.user.name;
      input.organizerEmail = req.user.email;
      input.department = input.department || req.user.department || '';
    }

    const validation = validateBookingInput(input);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors
      });
    }

    const bookingData = validation.data;

    // Check room existence and maintenance status
    const room = await prisma.room.findUnique({
      where: { id: bookingData.roomId },
      include: { company: true }
    });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Meeting room not found.' });
    }

    if (!room.isActive) {
      return res.status(400).json({ success: false, message: 'This meeting room is currently inactive.' });
    }

    if (room.isMaintenance) {
      return res.status(400).json({
        success: false,
        message: `This meeting room is currently under maintenance (${room.maintenanceNote || 'Maintenance'}).`
      });
    }

    let capacityWarning = null;
    if (bookingData.attendeesCount > room.capacityMax) {
      capacityWarning = `Attendee count (${bookingData.attendeesCount} pax) exceeds maximum room capacity (${room.capacityMax} seats).`;
    }

    // STRICT ANTI-COLLISION CHECK
    const { hasConflict, conflicts } = await checkRoomConflict(
      bookingData.roomId,
      bookingData.startTime,
      bookingData.endTime
    );

    if (hasConflict) {
      const clash = conflicts[0];
      const clashStart = new Date(clash.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      const clashEnd = new Date(clash.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      return res.status(409).json({
        success: false,
        isConflict: true,
        message: `Schedule clash detected with "${clash.title}" (${clashStart} - ${clashEnd} WIB by ${clash.organizerName}). Please select another time or room.`,
        conflicts: conflicts.map(c => ({
          id: c.id,
          title: c.title,
          organizerName: c.organizerName,
          startTime: c.startTime,
          endTime: c.endTime
        }))
      });
    }

    const calendarUid = `mra-meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@mra.co.id`;

    const newBooking = await prisma.booking.create({
      data: {
        ...bookingData,
        calendarUid
      },
      include: {
        room: {
          include: {
            company: true
          }
        }
      }
    });

    sendBookingConfirmation(newBooking, room, room.company).catch(err => {
      console.error('Async mail error:', err);
    });

    // Auto-persist any newly typed attendee emails into the master Attendee directory
    // so that Admin / GA can review and refine their company & department later
    try {
      const attendeeEmails = bookingData.attendees ? JSON.parse(bookingData.attendees) : [];
      if (Array.isArray(attendeeEmails) && attendeeEmails.length > 0) {
        prisma.company.findMany().then(async (companies) => {
          for (const em of attendeeEmails) {
            const exists = await prisma.attendee.findUnique({ where: { email: em } });
            if (!exists) {
              const inf = inferNameAndEntityFromEmail(em, companies);
              await prisma.attendee.create({
                data: {
                  fullName: inf.fullName,
                  email: inf.email,
                  companyId: inf.companyId,
                  department: inf.department,
                  jobTitle: inf.jobTitle,
                  phone: null
                }
              }).catch(() => {});
            }
          }
        }).catch(() => {});
      }
    } catch (e) {
      // Non-blocking
    }

    return res.status(201).json({
      success: true,
      message: 'Meeting room successfully booked and calendar invitations sent.',
      warning: capacityWarning,
      data: newBooking
    });
  } catch (error) {
    console.error('createBooking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create room booking.' });
  }
}

/**
 * Cancel a booking
 */
async function cancelBooking(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: { company: true }
        }
      }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Reservation not found.' });
    }

    if (existing.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'This reservation is already cancelled.' });
    }

    if (!canCancelBooking(req.user, existing)) {
      return res.status(403).json({
        success: false,
        message: existing.isConfidential
          ? 'This is a confidential meeting. Only the organizer or a Super Admin can cancel it.'
          : 'Only the organizer or a GA / Super Admin can cancel this reservation.'
      });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason || `Cancelled by ${req.user.name}`
      },
      include: {
        room: {
          include: { company: true }
        }
      }
    });

    sendBookingCancellation(updated, updated.room, updated.room.company, reason).catch(err => {
      console.error('Async cancel mail error:', err);
    });

    return res.json({
      success: true,
      message: 'Reservation successfully cancelled.',
      data: updated
    });
  } catch (error) {
    console.error('cancelBooking error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel reservation.' });
  }
}

module.exports = {
  getBookings,
  checkAvailability,
  createBooking,
  cancelBooking
};
