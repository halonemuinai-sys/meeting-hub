require('dotenv').config();
const prisma = require('../config/db');

async function seedConfidentialDummy() {
  console.log('🔒 Seeding Realistic MRA Confidential Meetings Dummy Data...');

  const rooms = await prisma.room.findMany({
    include: { company: true }
  });

  const roomMap = {};
  rooms.forEach(r => {
    roomMap[r.name] = r;
  });

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();

  // Helper to construct UTC date from WIB (WIB = UTC + 7)
  function createWibDate(year, month, day, wibHour, wibMinute) {
    const date = new Date(Date.UTC(year, month, day, wibHour - 7, wibMinute, 0));
    return date;
  }

  const confidentialMeetings = [
    {
      roomName: 'Ruang Meeting C',
      title: 'Confidential Holding M&A Due Diligence & Valuation Review',
      description: 'Strictly confidential internal assessment of strategic media acquisition targets and fiscal year financial projections with external legal counsel.',
      organizerName: 'Aris Setiyono',
      organizerEmail: 'admin@mra.co.id',
      department: 'IT & Shared Services',
      attendees: JSON.stringify(['hendra@mra.co.id', 'eko@mra.co.id', 'bambang@mra.co.id']),
      attendeesCount: 4,
      startTime: createWibDate(y, m, d, 13, 30),
      endTime: createWibDate(y, m, d, 15, 30),
      status: 'CONFIRMED',
      isConfidential: true,
      specialRequests: 'Secure soundproof door locked, Polycom conference ready with external London advisor'
    },
    {
      roomName: 'Ruang Meeting B',
      title: 'C-Level Executive Succession & Compensation Review',
      description: 'Private board compensation committee evaluation and talent succession planning for 2027 divisional restructuring.',
      organizerName: 'Dina Lestari',
      organizerEmail: 'user@mra.co.id',
      department: 'Human Resources (HR HUB)',
      attendees: JSON.stringify(['aris@mra.co.id', 'dina.hr@mra.co.id', 'rina@mra.co.id']),
      attendeesCount: 3,
      startTime: createWibDate(y, m, d, 15, 0),
      endTime: createWibDate(y, m, d, 16, 30),
      status: 'CONFIRMED',
      isConfidential: true,
      specialRequests: 'Private coffee service prior to session start, no interruptions please'
    },
    {
      roomName: 'Ruang Meeting Lt 10',
      title: 'Ultra High-Net-Worth VIP Client Private Viewing & Diamond Appraisal',
      description: 'Private closed-door boutique consultation and security appraisal for High Jewelry bespoke collection with VIP clients.',
      organizerName: 'Staff GA Mogems',
      organizerEmail: 'ga.mogems@mogems.co.id',
      department: 'Boutique Operations',
      attendees: JSON.stringify(['clarissa@mogems.co.id', 'jessica@mogems.co.id', 'ratna@mogems.co.id']),
      attendeesCount: 5,
      startTime: createWibDate(y, m, d, 14, 0),
      endTime: createWibDate(y, m, d, 16, 0),
      status: 'CONFIRMED',
      isConfidential: true,
      specialRequests: 'High-security escort, specialized jewelry display lighting & white glove inspection kits'
    },
    {
      roomName: 'R. Meeting Ruby',
      title: 'Exclusive Celebrity Artist Broadcasting Contract Renegotiation',
      description: 'Confidential commercial contract discussions, royalty sharing matrix, and multi-platform podcast syndication agreement.',
      organizerName: 'Staff GA Media',
      organizerEmail: 'ga.media@mramedia.co.id',
      department: 'Creative & Editorial',
      attendees: JSON.stringify(['reza@mramedia.co.id', 'maya@mramedia.co.id', 'aditya@mramedia.co.id']),
      attendeesCount: 4,
      startTime: createWibDate(y, m, d, 11, 30),
      endTime: createWibDate(y, m, d, 13, 0),
      status: 'CONFIRMED',
      isConfidential: true,
      specialRequests: 'Studio soundproof barrier activated, NDA documents prepared on table'
    },
    {
      roomName: 'Ruang Meeting A',
      title: 'Group Internal Audit & Risk Assessment Findings (Pre-BOD)',
      description: 'Strictly restricted compliance review of annual audit findings and enterprise risk mitigation strategy before presenting to Shareholders.',
      organizerName: 'Bambang Sudibyo',
      organizerEmail: 'ga.holding@mra.co.id',
      department: 'General Affairs',
      attendees: JSON.stringify(['admin@mra.co.id', 'hendra@mra.co.id', 'eko@mra.co.id']),
      attendeesCount: 6,
      startTime: createWibDate(y, m, d + 1, 10, 0),
      endTime: createWibDate(y, m, d + 1, 12, 0),
      status: 'CONFIRMED',
      isConfidential: true,
      specialRequests: 'Dual screen projector connected, encrypted wireless network required'
    }
  ];

  for (const m of confidentialMeetings) {
    const room = roomMap[m.roomName];
    if (!room) {
      console.warn(`⚠️ Room not found: ${m.roomName}`);
      continue;
    }

    const calendarUid = `mra-conf-${Date.now()}-${Math.random().toString(36).substr(2, 8)}@mra.co.id`;

    // Upsert or create
    const created = await prisma.booking.create({
      data: {
        roomId: room.id,
        title: m.title,
        description: m.description,
        organizerName: m.organizerName,
        organizerEmail: m.organizerEmail,
        department: m.department,
        attendees: m.attendees,
        attendeesCount: m.attendeesCount,
        startTime: m.startTime,
        endTime: m.endTime,
        status: m.status,
        isConfidential: m.isConfidential,
        specialRequests: m.specialRequests,
        calendarUid
      }
    });

    console.log(`✅ Seeded Confidential Booking: "${created.title}" at ${m.roomName} (${m.organizerName})`);
  }

  console.log('\n🎉 Finished seeding 5 realistic confidential meetings!');
  process.exit(0);
}

seedConfidentialDummy().catch(e => {
  console.error('Error seeding confidential meetings:', e);
  process.exit(1);
});
