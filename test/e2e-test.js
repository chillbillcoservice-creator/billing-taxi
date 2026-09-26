const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================');
  console.log('🚀 RUNNING BILLING TAXI E2E TESTS');
  console.log('====================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Check Unauthenticated session
    const meRes = await fetch(`${BASE_URL}/api/auth/me`);
    const meData = await meRes.json();
    assert(meData.user === null, 'Unauthenticated user correctly receives null session');

    // 2. Login as Pilot Arun
    const pilotLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'pilot_arun', password: 'pilot123' }),
    });
    const pilotCookie = pilotLoginRes.headers.get('set-cookie');
    const pilotData = await pilotLoginRes.json();
    assert(pilotLoginRes.status === 200 && pilotData.user.username === 'pilot_arun', 'Pilot Arun logged in successfully');

    // 3. Register a fresh pilot to test clean booking flow
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Thakur',
        username: `kavita_${Date.now()}`,
        phone: `+9198160${Math.floor(10000 + Math.random() * 90000)}`,
        password: 'password123',
        role: 'MEMBER',
        pilotGlider: 'Ozone Geo 6',
      }),
    });
    const regData = await regRes.json();
    const kavitaCookie = regRes.headers.get('set-cookie');
    assert(regRes.status === 200 && !!regData.user?.id, 'Registered fresh pilot Kavita');

    // 4. Fetch Today's Taxis
    const taxisRes = await fetch(`${BASE_URL}/api/taxis?date=today`);
    const taxisData = await taxisRes.json();
    assert(Array.isArray(taxisData.trips) && taxisData.trips.length > 0, `Retrieved ${taxisData.trips?.length} today's taxi trips`);

    const openTrip = taxisData.trips.find(t => t.availableSeats > 0 && t.status !== 'CANCELLED');
    assert(!!openTrip, `Found an open taxi trip (ID: ${openTrip?.id}, Available Seats: ${openTrip?.availableSeats})`);

    // 5. Test Join Taxi Concurrency / Seat Locking with new pilot
    if (openTrip) {
      const initialSeats = openTrip.availableSeats;
      const joinRes = await fetch(`${BASE_URL}/api/taxis/${openTrip.id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': kavitaCookie || '',
        },
        body: JSON.stringify({ seats: 1 }),
      });
      const joinData = await joinRes.json();
      assert(joinRes.status === 200 && joinData.data.trip.availableSeats === initialSeats - 1, `Seat booking atomically decremented available seats from ${initialSeats} to ${initialSeats - 1}`);

      // 6. Test Leave / Cancel Booking
      const leaveRes = await fetch(`${BASE_URL}/api/taxis/${openTrip.id}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': kavitaCookie || '',
        },
      });
      const leaveData = await leaveRes.json();
      assert(leaveRes.status === 200 && leaveData.trip.availableSeats === initialSeats, `Leaving taxi restored the available seats back to ${initialSeats}`);
    }

    // 6. Community Chat Post
    const chatPostRes = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': pilotCookie || '',
      },
      body: JSON.stringify({
        content: 'Testing takeoff conditions at Billing 2430m @admin',
        mediaType: 'NONE',
      }),
    });
    const chatPostData = await chatPostRes.json();
    assert(chatPostRes.status === 200 && !!chatPostData.message?.id, 'Successfully posted message to community chat with @mention');

    // 7. Verify Community Chat Feed
    const chatFeedRes = await fetch(`${BASE_URL}/api/chat`);
    const chatFeedData = await chatFeedRes.json();
    assert(Array.isArray(chatFeedData.messages) && chatFeedData.messages.length > 0, `Fetched ${chatFeedData.messages?.length} community chat messages`);

    // 8. Lost & Found Board
    const lfRes = await fetch(`${BASE_URL}/api/lost-found`);
    const lfData = await lfRes.json();
    assert(Array.isArray(lfData.items) && lfData.items.length > 0, `Fetched ${lfData.items?.length} Lost & Found board items`);

    // 9. Equipment Marketplace Classifieds
    const marketRes = await fetch(`${BASE_URL}/api/marketplace`);
    const marketData = await marketRes.json();
    assert(Array.isArray(marketData.listings) && marketData.listings.length > 0, `Fetched ${marketData.listings?.length} paragliding gear listings`);

    // 10. Public QR Permit Verification
    const permitRes = await fetch(`${BASE_URL}/api/permissions/permits/HP-BIR-2026-1088`);
    const permitData = await permitRes.json();
    assert(permitRes.status === 200 && permitData.permit.status === 'VALID' && permitData.permit.permitNumber === 'HP-BIR-2026-1088', 'Public QR permit verification successfully validated official permit');

    // 11. Admin Login & Stats Telemetry
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'admin123' }),
    });
    const adminCookie = adminLoginRes.headers.get('set-cookie');
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminData.user.role === 'ADMIN', 'Admin logged in with role ADMIN');

    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { 'Cookie': adminCookie || '' },
    });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.stats.totalUsers >= 5, `Admin stats verified: ${statsData.stats?.totalUsers} users, ${statsData.stats?.todayTrips} trips today`);

    console.log('\n====================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runTests();
