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
          room: { isActive: true },
          startTime: { lte: endOfToday },
          endTime: { gte: startOfToday }
        }
      }),
      // Bookings this week
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          room: { isActive: true },
          startTime: { lte: endOfWeek },
          endTime: { gte: startOfWeek }
        }
      }),
      // Ongoing meetings right now
      prisma.booking.count({
        where: {
          status: 'CONFIRMED',
          room: { isActive: true },
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
        where: { isActive: true },
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

/**
 * Get comprehensive analytics and report data
 * Supports filters: startDate, endDate, roomId, companyId, category, status
 */
async function getReports(req, res) {
  try {
    const { startDate, endDate, roomId, companyId, category, status } = req.query;

    const where = {};

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
      where.room = { companyId };
    }

    if (startDate || endDate) {
      where.AND = where.AND || [];
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.AND.push({ startTime: { gte: start } });
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.AND.push({ endTime: { lte: end } });
      }
    }

    // Fetch all bookings matching filter
    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          include: {
            company: true
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    // Also fetch all rooms for occupancy calculations
    const allRooms = await prisma.room.findMany({
      where: { isActive: true },
      include: { company: true }
    });

    // 1. KPI Calculations
    let totalMinutes = 0;
    let totalAttendees = 0;
    const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED');
    const cancelledCount = bookings.filter(b => b.status === 'CANCELLED').length;

    confirmedBookings.forEach(b => {
      const dur = Math.max(0, (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60));
      totalMinutes += dur;
      totalAttendees += (b.attendeesCount || 1);
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const avgDurationMins = confirmedBookings.length > 0 ? Math.round(totalMinutes / confirmedBookings.length) : 0;
    const avgAttendees = confirmedBookings.length > 0 ? Math.round((totalAttendees / confirmedBookings.length) * 10) / 10 : 0;

    // 2. Room Utilization Breakdown
    const roomStatsMap = {};
    allRooms.forEach(r => {
      roomStatsMap[r.id] = {
        roomId: r.id,
        roomName: r.name,
        companyName: r.company.name,
        floor: r.floor || 'Unknown Floor',
        colorCode: r.colorCode || '#2563eb',
        capacityMax: r.capacityMax,
        bookingCount: 0,
        totalMinutes: 0,
        totalHours: 0,
        attendeesTotal: 0
      };
    });

    confirmedBookings.forEach(b => {
      if (roomStatsMap[b.roomId]) {
        const dur = Math.max(0, (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60));
        roomStatsMap[b.roomId].bookingCount += 1;
        roomStatsMap[b.roomId].totalMinutes += dur;
        roomStatsMap[b.roomId].attendeesTotal += (b.attendeesCount || 1);
      }
    });

    const roomUtilization = Object.values(roomStatsMap).map(stat => ({
      ...stat,
      totalHours: Math.round((stat.totalMinutes / 60) * 10) / 10,
      avgAttendees: stat.bookingCount > 0 ? Math.round((stat.attendeesTotal / stat.bookingCount) * 10) / 10 : 0
    })).sort((a, b) => b.totalHours - a.totalHours);

    // 3. Category Breakdown
    const categoryStatsMap = {};
    confirmedBookings.forEach(b => {
      const cat = b.category || 'General Meeting';
      if (!categoryStatsMap[cat]) {
        categoryStatsMap[cat] = { category: cat, count: 0, totalMinutes: 0 };
      }
      const dur = Math.max(0, (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60));
      categoryStatsMap[cat].count += 1;
      categoryStatsMap[cat].totalMinutes += dur;
    });

    const categoryBreakdown = Object.values(categoryStatsMap).map(c => ({
      ...c,
      totalHours: Math.round((c.totalMinutes / 60) * 10) / 10,
      percentage: confirmedBookings.length > 0 ? Math.round((c.count / confirmedBookings.length) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // 4. Department Activity Breakdown
    const departmentStatsMap = {};
    confirmedBookings.forEach(b => {
      const dept = b.department || 'General';
      if (!departmentStatsMap[dept]) {
        departmentStatsMap[dept] = { department: dept, count: 0, totalHours: 0 };
      }
      const dur = Math.max(0, (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60));
      departmentStatsMap[dept].count += 1;
      departmentStatsMap[dept].totalHours += Math.round(dur * 10) / 10;
    });

    const departmentBreakdown = Object.values(departmentStatsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. Peak Hours Distribution (08:00 - 19:00 WIB)
    const hourlyCounts = Array(12).fill(0); // 8 to 19
    confirmedBookings.forEach(b => {
      const startH = new Date(b.startTime).getHours();
      const endH = new Date(b.endTime).getHours();
      for (let h = startH; h <= endH && h <= 19; h++) {
        if (h >= 8 && h <= 19) {
          hourlyCounts[h - 8]++;
        }
      }
    });

    const peakHours = hourlyCounts.map((count, idx) => ({
      hour: `${(idx + 8).toString().padStart(2, '0')}:00`,
      bookings: count
    }));

    // 6. Detailed Bookings Table (Formatted for Display & Excel/CSV Export)
    const detailedList = bookings.map(b => ({
      id: b.id,
      title: b.title,
      roomName: b.room.name,
      roomFloor: b.room.floor || 'Unknown Floor',
      companyName: b.room.company.name,
      organizerName: b.organizerName,
      organizerEmail: b.organizerEmail,
      department: b.department,
      category: b.category || 'General Meeting',
      isConfidential: b.isConfidential,
      status: b.status,
      startTime: b.startTime,
      endTime: b.endTime,
      durationMinutes: Math.max(0, (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60)),
      attendeesCount: b.attendeesCount,
      cancelReason: b.cancelReason || null,
      createdAt: b.createdAt
    }));

    return res.json({
      success: true,
      data: {
        kpi: {
          totalBookings: bookings.length,
          confirmedBookings: confirmedBookings.length,
          cancelledBookings: cancelledCount,
          totalHours,
          avgDurationMins,
          avgAttendees
        },
        roomUtilization,
        categoryBreakdown,
        departmentBreakdown,
        peakHours,
        detailedList
      }
    });
  } catch (error) {
    console.error('getReports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate reports data.' });
  }
}

module.exports = {
  getDashboardSummary,
  getReports
};

