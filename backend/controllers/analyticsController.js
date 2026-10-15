const prisma = require('../config/db');

/**
 * Get dashboard KPI summary
 */
async function getDashboardSummary(req, res) {
  try {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const [
      todayCount,
      thisWeekCount,
      ongoingCount,
      totalRoomsCount,
      rooms
    ] = await Promise.all([
      // Bookings today
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          startTime: { lte: endOfToday },
          endTime: { gte: startOfToday }
        }
      }),
      // Bookings this week
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          startTime: { lte: endOfWeek },
          endTime: { gte: startOfWeek }
        }
      }),
      // Ongoing meetings right now
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          startTime: { lte: now },
          endTime: { gte: now }
        }
      }),
      // Total active rooms
      prisma.room.count({
        where: { isActive: true }
      }),
      // List of rooms with their current status
      prisma.room.findMany({
        include: {
          company: true,
          bookings: {
            where: {
              status: 'CONFIRMED',
              startTime: { lte: now },
              endTime: { gte: now }
            },
            take: 1
          }
        },
        orderBy: { name: 'asc' }
      })
    ]);

    const roomStatusList = rooms.map(r => {
      const currentMeeting = r.bookings[0] || null;
      let parsedAmenities = [];
      try {
        parsedAmenities = r.amenities ? JSON.parse(r.amenities) : [];
      } catch {
        parsedAmenities = [];
      }

      return {
        id: r.id,
        name: r.name,
        companyName: r.company.name,
        floor: r.floor,
        capacityMin: r.capacityMin,
        capacityMax: r.capacityMax,
        colorCode: r.colorCode,
        amenities: parsedAmenities,
        isMaintenance: r.isMaintenance,
        maintenanceNote: r.maintenanceNote,
        isOccupied: !!currentMeeting,
        currentMeeting: currentMeeting ? {
          title: currentMeeting.title,
          organizerName: currentMeeting.organizerName,
          startTime: currentMeeting.startTime,
          endTime: currentMeeting.endTime
        } : null
      };
    });

    return res.json({
      success: true,
      data: {
        summary: {
          today: todayCount,
          thisWeek: thisWeekCount,
          ongoing: ongoingCount,
          totalRooms: totalRoomsCount
        },
        rooms: roomStatusList
      }
    });
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data ringkasan dashboard.' });
  }
}

module.exports = {
  getDashboardSummary
};
