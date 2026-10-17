require('dotenv').config();
const prisma = require('../config/db');

async function main() {
  console.log('🌱 Starting Comprehensive MRA Seeding...');

  // 1. Seed Companies
  const companiesData = [
    { code: 'MOGEMS', name: 'PT Mogems Putri International' },
    { code: 'MRA_HOLDING', name: 'PT Mugi Rekso Abadi' },
    { code: 'MRA_MEDIA', name: 'MRA Media' }
  ];

  const companies = {};
  for (const c of companiesData) {
    const company = await prisma.company.upsert({
      where: { code: c.code },
      update: { name: c.name },
      create: { code: c.code, name: c.name }
    });
    companies[c.code] = company;
    console.log(`✅ Upserted Company: ${company.name}`);
  }

  // 2. Seed Master Amenities
  const masterAmenities = [
    { name: 'Smart TV 65 Inch', category: 'VISUAL_DISPLAY', icon: 'Tv', description: 'Monitor layar 4K 65 inch dengan input HDMI & wireless cast' },
    { name: 'Smart TV 55 Inch', category: 'VISUAL_DISPLAY', icon: 'Tv', description: 'Monitor layar 55 inch untuk ruang meeting compact' },
    { name: 'Dual Screen Projector', category: 'VISUAL_DISPLAY', icon: 'Projector', description: 'Proyektor ganda laser resolusi tinggi untuk hall utama' },
    { name: 'Large Media Display', category: 'VISUAL_DISPLAY', icon: 'Tv', description: 'Display broadcast lebar untuk preview media visual' },
    { name: '4K Video Conference', category: 'AUDIO_CONFERENCE', icon: 'Video', description: 'Kamera PTZ 4K auto-tracking dan mic array' },
    { name: 'Polycom Conference', category: 'AUDIO_CONFERENCE', icon: 'Mic', description: 'Sistem panggilan telepon & audio konferensi omnidirectional' },
    { name: 'Surround Mic Board', category: 'AUDIO_CONFERENCE', icon: 'Mic', description: 'Mikrofon terdistribusi langit-langit meja rapat' },
    { name: 'Soundbar Mic', category: 'AUDIO_CONFERENCE', icon: 'Volume2', description: 'Soundbar dengan mikrofon echo cancellation' },
    { name: 'Studio Mics', category: 'AUDIO_CONFERENCE', icon: 'Mic', description: 'Mikrofon kondensor standar studio podcast/broadcast' },
    { name: 'High-speed WiFi 6', category: 'CONNECTIVITY', icon: 'Wifi', description: 'Jaringan internet nirkabel khusus tamu & staff' },
    { name: 'HDMI 4K Cable', category: 'CONNECTIVITY', icon: 'Cable', description: 'Kabel transmisi display ultra HD' },
    { name: 'Wireless Presentation Pointer', category: 'CONNECTIVITY', icon: 'Cast', description: 'Presenter clicker dengan laser penunjuk' },
    { name: 'Extension Power Bar', category: 'CONNECTIVITY', icon: 'Zap', description: 'Colokan listrik multi-port & USB charging' },
    { name: 'Glass Whiteboard', category: 'ROOM_COMFORT', icon: 'Square', description: 'Papan tulis kaca premium dilengkapi spidol warna' },
    { name: 'Air Purifier', category: 'ROOM_COMFORT', icon: 'Wind', description: 'Penyaring udara HEPA untuk sirkulasi ruangan tertutup' },
    { name: 'Acoustic Soundproofing', category: 'ROOM_COMFORT', icon: 'Shield', description: 'Peredam suara dinding studio media' }
  ];

  for (const a of masterAmenities) {
    await prisma.amenity.upsert({
      where: { name: a.name },
      update: a,
      create: a
    });
  }
  console.log(`✅ Seeded ${masterAmenities.length} Master Amenities`);

  // 3. Seed Meeting Rooms
  const roomsData = [
    {
      companyId: companies['MOGEMS'].id,
      name: 'Ruang Meeting Lt 10',
      floor: 'Lantai 10',
      capacityMin: 7,
      capacityMax: 9,
      amenities: JSON.stringify(['Smart TV 65 Inch', 'Polycom Conference', 'Glass Whiteboard', 'High-speed WiFi 6']),
      colorCode: '#d97706'
    },
    {
      companyId: companies['MRA_HOLDING'].id,
      name: 'Ruang Meeting A',
      floor: '8th Floor (Lt 8)',
      capacityMin: 14,
      capacityMax: 20,
      amenities: JSON.stringify(['Dual Screen Projector', '4K Video Conference', 'Surround Mic Board', 'Glass Whiteboard']),
      colorCode: '#2563eb'
    },
    {
      companyId: companies['MRA_HOLDING'].id,
      name: 'Ruang Meeting B',
      floor: '8th Floor (Lt 8)',
      capacityMin: 4,
      capacityMax: 6,
      amenities: JSON.stringify(['Smart TV 55 Inch', 'Glass Whiteboard', 'Extension Power Bar']),
      colorCode: '#4f46e5'
    },
    {
      companyId: companies['MRA_HOLDING'].id,
      name: 'Ruang Meeting C',
      floor: '8th Floor (Lt 8)',
      capacityMin: 8,
      capacityMax: 12,
      amenities: JSON.stringify(['Smart TV 65 Inch', 'Soundbar Mic', 'Glass Whiteboard', 'Air Purifier']),
      colorCode: '#0284c7'
    },
    {
      companyId: companies['MRA_MEDIA'].id,
      name: 'R. Meeting Diamond',
      floor: 'Media Wing / Studio',
      capacityMin: 12,
      capacityMax: 15,
      amenities: JSON.stringify(['Acoustic Soundproofing', 'Large Media Display', 'Studio Mics', '4K Video Conference']),
      colorCode: '#e11d48'
    }
  ];

  const createdRooms = [];
  for (const r of roomsData) {
    let existing = await prisma.room.findFirst({
      where: { companyId: r.companyId, name: r.name }
    });

    if (existing) {
      existing = await prisma.room.update({ where: { id: existing.id }, data: r });
      createdRooms.push(existing);
    } else {
      const room = await prisma.room.create({ data: r });
      createdRooms.push(room);
    }
  }
  console.log(`✅ Seeded ${createdRooms.length} Meeting Rooms`);

  // 4. Seed Master Attendees (Peserta / Direktori Karyawan)
  const masterAttendees = [
    // Mogems
    { fullName: 'Clarissa Setiawan', email: 'clarissa@mogems.co.id', companyId: companies['MOGEMS'].id, department: 'Boutique Operations', jobTitle: 'Store General Manager', phone: '+62 811-2233-4451' },
    { fullName: 'Ratna Sari', email: 'ratna@mogems.co.id', companyId: companies['MOGEMS'].id, department: 'Merchandising', jobTitle: 'Senior Merchandiser', phone: '+62 812-3344-5562' },
    { fullName: 'Budi Pratama', email: 'budi@mogems.co.id', companyId: companies['MOGEMS'].id, department: 'Finance & Accounting', jobTitle: 'Finance Supervisor', phone: '+62 813-4455-6673' },
    { fullName: 'Jessica Iskandar', email: 'jessica@mogems.co.id', companyId: companies['MOGEMS'].id, department: 'VIP Client Relations', jobTitle: 'CRM Lead', phone: '+62 815-5566-7784' },

    // Holding MRA
    { fullName: 'Aris Setiyono', email: 'aris@mra.co.id', companyId: companies['MRA_HOLDING'].id, department: 'IT & Shared Services', jobTitle: 'Head of IT & Systems', phone: '+62 816-6677-8895' },
    { fullName: 'Bambang Sudibyo', email: 'bambang@mra.co.id', companyId: companies['MRA_HOLDING'].id, department: 'General Affairs', jobTitle: 'GA Manager', phone: '+62 817-7788-9906' },
    { fullName: 'Dina Lestari', email: 'dina.hr@mra.co.id', companyId: companies['MRA_HOLDING'].id, department: 'Human Resources (HR HUB)', jobTitle: 'Talent Acquisition Lead', phone: '+62 818-8899-0017' },
    { fullName: 'Eko Purnomo', email: 'eko@mra.co.id', companyId: companies['MRA_HOLDING'].id, department: 'Legal & Compliance', jobTitle: 'Senior Legal Counsel', phone: '+62 819-9900-1128' },
    { fullName: 'Hendra Gunawan', email: 'hendra@mra.co.id', companyId: companies['MRA_HOLDING'].id, department: 'Finance Holding', jobTitle: 'Finance Director', phone: '+62 821-1122-3349' },
    { fullName: 'Rina Wijaya', email: 'rina@mra.co.id', companyId: companies['MRA_HOLDING'].id, department: 'Corporate Secretarial', jobTitle: 'Corp Secretary Specialist', phone: '+62 822-2233-4450' },

    // MRA Media
    { fullName: 'Reza Rahardian', email: 'reza@mramedia.co.id', companyId: companies['MRA_MEDIA'].id, department: 'Creative & Editorial', jobTitle: 'Managing Editor', phone: '+62 823-3344-5561' },
    { fullName: 'Maya Safitri', email: 'maya@mramedia.co.id', companyId: companies['MRA_MEDIA'].id, department: 'Broadcasting & Podcast', jobTitle: 'Executive Producer', phone: '+62 824-4455-6672' },
    { fullName: 'Aditya Putra', email: 'aditya@mramedia.co.id', companyId: companies['MRA_MEDIA'].id, department: 'Digital Media Operations', jobTitle: 'Digital Operations Lead', phone: '+62 825-5566-7783' }
  ];

  for (const at of masterAttendees) {
    await prisma.attendee.upsert({
      where: { email: at.email },
      update: at,
      create: at
    });
  }
  console.log(`✅ Seeded ${masterAttendees.length} Master Attendees (Directory)`);

  const bcrypt = require('bcryptjs');
  const defaultPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 5. Seed Users & Access
  const users = [
    { email: 'admin@mra.co.id', name: 'Aris Setiyono', password: defaultPasswordHash, role: 'SUPER_ADMIN', companyId: companies['MRA_HOLDING'].id, department: 'IT & Shared Services' },
    { email: 'ga.holding@mra.co.id', name: 'Bambang Sudibyo (GA Holding)', password: defaultPasswordHash, role: 'GA_ADMIN', companyId: companies['MRA_HOLDING'].id, department: 'General Affairs' },
    { email: 'ga.mogems@mogems.co.id', name: 'Staff GA Mogems', password: defaultPasswordHash, role: 'GA_ADMIN', companyId: companies['MOGEMS'].id, department: 'General Affairs' },
    { email: 'ga.media@mramedia.co.id', name: 'Staff GA Media', password: defaultPasswordHash, role: 'GA_ADMIN', companyId: companies['MRA_MEDIA'].id, department: 'General Affairs' },
    { email: 'user@mra.co.id', name: 'Dina Lestari', password: defaultPasswordHash, role: 'USER', companyId: companies['MRA_HOLDING'].id, department: 'Human Resources' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u
    });
  }
  console.log(`✅ Seeded ${users.length} Users with RBAC`);

  console.log('🎉 All Master Data Successfully Seeded!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
