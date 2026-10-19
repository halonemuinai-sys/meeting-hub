const urllib = require('http');

const BASE_URL = 'http://localhost:5007';

function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = urllib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('===========================================================');
  console.log('🔍 RUNNING COMPREHENSIVE MRA MEETING HUB LOGIC AUDIT');
  console.log('===========================================================\n');

  const report = [];

  // TEST 1: Health Check
  try {
    const res = await request('GET', '/api/health');
    const ok = res.status === 200 && res.data.status === 'healthy';
    report.push({
      test: '1. Backend Service Health Check',
      status: ok ? 'PASS ✅' : 'FAIL ❌',
      detail: `Status ${res.status}, Service: ${res.data?.service}`
    });
  } catch (err) {
    report.push({ test: '1. Backend Service Health Check', status: 'FAIL ❌', detail: err.message });
  }

  // TEST 2: Meeting Rooms & Floor 8 Rule
  let rooms = [];
  try {
    const res = await request('GET', '/api/rooms');
    rooms = res.data?.data || [];
    const roomA = rooms.find(r => r.name === 'Ruang Meeting A');
    const roomB = rooms.find(r => r.name === 'Ruang Meeting B');
    const roomC = rooms.find(r => r.name === 'Ruang Meeting C');

    const allFloor8 = roomA?.floor?.includes('8th Floor') &&
                      roomB?.floor?.includes('8th Floor') &&
                      roomC?.floor?.includes('8th Floor');

    report.push({
      test: '2. Meeting Rooms & Floor 8 Rule (Ruang A, B, C = Lt 8)',
      status: allFloor8 ? 'PASS ✅' : 'FAIL ❌',
      detail: `Found ${rooms.length} active rooms. Ruang A: "${roomA?.floor}", B: "${roomB?.floor}", C: "${roomC?.floor}"`
    });
  } catch (err) {
    report.push({ test: '2. Meeting Rooms & Floor 8 Rule', status: 'FAIL ❌', detail: err.message });
  }

  // TEST 3: Authentication & Role-Based Access
  let adminToken = null;
  let userToken = null;
  try {
    const adminLogin = await request('POST', '/api/auth/login', {
      email: 'admin@mra.co.id',
      password: 'Admin@123'
    });
    adminToken = adminLogin.data?.token;

    const userLogin = await request('POST', '/api/auth/login', {
      email: 'user@mra.co.id',
      password: 'Admin@123'
    });
    userToken = userLogin.data?.token;

    const ok = adminLogin.status === 200 && userLogin.status === 200 && adminToken && userToken;
    report.push({
      test: '3. Authentication & JWT Issuance (Super Admin & User)',
      status: ok ? 'PASS ✅' : 'FAIL ❌',
      detail: `Admin role: ${adminLogin.data?.user?.role}, User role: ${userLogin.data?.user?.role}`
    });
  } catch (err) {
    report.push({ test: '3. Authentication & JWT Issuance', status: 'FAIL ❌', detail: err.message });
  }

  // TEST 4: Confidential Meeting Privacy Masking
  try {
    // Guest query (unauthenticated)
    const guestRes = await request('GET', '/api/bookings');
    const guestEvents = guestRes.data?.data?.events || [];
    const confidentialGuest = guestEvents.find(e => e.isConfidential);

    // Admin query (authenticated Super Admin)
    const adminRes = await request('GET', '/api/bookings', null, adminToken);
    const adminEvents = adminRes.data?.data?.events || [];
    const confidentialAdmin = adminEvents.find(e => e.id === confidentialGuest?.id);

    const isMaskedForGuest = confidentialGuest?.title?.includes('Private Meeting') &&
                             confidentialGuest?.organizerName === 'Private Organizer';
    const isRevealedForAdmin = confidentialAdmin &&
                               !confidentialAdmin.title?.includes('Reserved') &&
                               confidentialAdmin.canViewConfidential === true;

    const ok = isMaskedForGuest && isRevealedForAdmin;
    report.push({
      test: '4. Confidential Meeting Privacy Masking Logic',
      status: ok ? 'PASS ✅' : 'FAIL ❌',
      detail: `Guest view: "${confidentialGuest?.title}" (masked: ${isMaskedForGuest}), Admin view: "${confidentialAdmin?.title}" (revealed: ${isRevealedForAdmin})`
    });
  } catch (err) {
    report.push({ test: '4. Confidential Meeting Privacy Masking Logic', status: 'FAIL ❌', detail: err.message });
  }

  // TEST 5: Strict Collision Prevention Engine
  try {
    const testRoom = rooms[0];
    if (testRoom) {
      const now = new Date();
      const testStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 0, 0)).toISOString();
      const testEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 3, 11, 30, 0)).toISOString();

      // Create primary test booking
      const book1 = await request('POST', '/api/bookings', {
        title: 'Collision Test Baseline Meeting',
        roomId: testRoom.id,
        organizerName: 'System Auditor',
        organizerEmail: 'audit@mra.co.id',
        department: 'IT Audit',
        startTime: testStart,
        endTime: testEnd,
        attendeesCount: 5,
        category: 'Weekly Meeting'
      }, adminToken);

      // Attempt overlapping booking (starts inside first meeting)
      const overlapStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 3, 10, 30, 0)).toISOString();
      const overlapEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12, 0, 0)).toISOString();

      const clashRes = await request('POST', '/api/bookings', {
        title: 'Clashing Overlapping Meeting',
        roomId: testRoom.id,
        organizerName: 'System Auditor 2',
        organizerEmail: 'audit2@mra.co.id',
        department: 'IT Audit',
        startTime: overlapStart,
        endTime: overlapEnd,
        attendeesCount: 3,
        category: 'Ad-hoc / Urgent Meeting'
      }, adminToken);

      // Clean up primary test booking
      if (book1.data?.data?.id) {
        await request('POST', `/api/bookings/${book1.data.data.id}/cancel`, { reason: 'Automated test cleanup' }, adminToken);
      }

      const collisionBlocked = clashRes.status === 409 && clashRes.data?.isConflict === true;
      report.push({
        test: '5. Collision Prevention Engine (Anti-Overlap Check)',
        status: collisionBlocked ? 'PASS ✅' : 'FAIL ❌',
        detail: `Baseline creation status: ${book1.status}, Overlapping attempt status: ${clashRes.status} (Blocked: ${collisionBlocked})`
      });
    }
  } catch (err) {
    report.push({ test: '5. Collision Prevention Engine', status: 'FAIL ❌', detail: err.message });
  }

  // TEST 6: Category Filter Logic
  try {
    const catRes = await request('GET', '/api/bookings?category=Quarterly%20Meeting');
    const events = catRes.data?.data?.events || [];
    const allMatch = events.length > 0 && events.every(e => e.category === 'Quarterly Meeting');

    report.push({
      test: '6. Meeting Category Filtering & Presets Logic',
      status: allMatch ? 'PASS ✅' : 'FAIL ❌',
      detail: `Filtered ${events.length} meetings with category "Quarterly Meeting" (All match: ${allMatch})`
    });
  } catch (err) {
    report.push({ test: '6. Meeting Category Filtering & Presets Logic', status: 'FAIL ❌', detail: err.message });
  }

  // TEST 7: Forgot Password & 6-Digit OTP Recovery
  try {
    const forgotRes = await request('POST', '/api/auth/forgot-password', {
      email: 'user@mra.co.id'
    });
    const otp = forgotRes.data?.devOtp;
    const token = forgotRes.data?.resetToken;

    const verifyRes = await request('POST', '/api/auth/verify-reset-code', {
      email: 'user@mra.co.id',
      code: otp,
      token: token
    });

    const ok = forgotRes.status === 200 && verifyRes.status === 200 && otp?.length === 6;
    report.push({
      test: '7. Forgot Password 6-Digit OTP & Verification Flow',
      status: ok ? 'PASS ✅' : 'FAIL ❌',
      detail: `OTP Issued: ${otp} (6 digits: ${otp?.length === 6}), Code verified: ${verifyRes.data?.success}`
    });
  } catch (err) {
    report.push({ test: '7. Forgot Password 6-Digit OTP & Verification Flow', status: 'FAIL ❌', detail: err.message });
  }

  // TEST 8: Reports & Room Analytics Endpoint
  try {
    const repRes = await request('GET', '/api/analytics/reports');
    const kpi = repRes.data?.data?.kpi;
    const utilization = repRes.data?.data?.roomUtilization || [];
    const peakHours = repRes.data?.data?.peakHours || [];

    const ok = repRes.status === 200 &&
               typeof kpi?.totalBookings === 'number' &&
               typeof kpi?.totalHours === 'number' &&
               utilization.length > 0 &&
               peakHours.length === 12;

    report.push({
      test: '8. Reports & Analytics Engine (KPI, Utilization, Peak Heatmap)',
      status: ok ? 'PASS ✅' : 'FAIL ❌',
      detail: `KPI Total: ${kpi?.totalBookings} mtgs, ${kpi?.totalHours} hrs | Rooms analyzed: ${utilization.length} | Peak hours: ${peakHours.length} slots`
    });
  } catch (err) {
    report.push({ test: '8. Reports & Analytics Engine', status: 'FAIL ❌', detail: err.message });
  }

  // Print results
  console.log('\n===========================================================');
  console.log('📋 AUDIT EXECUTION SUMMARY REPORT:');
  console.log('===========================================================');
  report.forEach(r => {
    console.log(`\n[${r.status}] ${r.test}`);
    console.log(`   ↳ Detail: ${r.detail}`);
  });

  const totalPass = report.filter(r => r.status.includes('PASS')).length;
  console.log('\n===========================================================');
  console.log(`🎯 FINAL RESULT: ${totalPass}/${report.length} LOGIC SUITES PASSED PERFECTLY`);
  console.log('===========================================================\n');
}

runAudit();
