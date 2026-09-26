const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

const prisma = new PrismaClient();

async function main() {
  console.log('Checking database state...');
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    console.log(`Database already has ${userCount} users. Skipping seed.`);
    return;
  }

  console.log('Seeding paragliding community database...');

  // Clean existing tables
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.permit.deleteMany({});
  await prisma.partnerDocument.deleteMany({});
  await prisma.partnerApplication.deleteMany({});
  await prisma.marketplaceListing.deleteMany({});
  await prisma.lostFoundItem.deleteMany({});
  await prisma.chatReport.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.taxiBooking.deleteMany({});
  await prisma.taxiTrip.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('admin123', 10);
  const pilotPasswordHash = await bcrypt.hash('pilot123', 10);
  const partnerPasswordHash = await bcrypt.hash('partner123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Capt. Vikram Rana (BHPPA Admin)',
      username: 'admin',
      phone: '+919805011001',
      email: 'admin@billingtaxi.in',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      isPilotVerified: true,
      pilotGlider: 'Ozone Zeno 2 (EN-D)',
      pilotLicenseNumber: 'FAI-IND-8821',
      bio: 'Bir-Billing Paragliding Association Operations Lead & Flight Controller',
    },
  });

  const moderator = await prisma.user.create({
    data: {
      name: 'Suresh Thakur (Safety Marshal)',
      username: 'mod_suresh',
      phone: '+919805011002',
      email: 'suresh@billingtaxi.in',
      passwordHash: defaultPasswordHash,
      role: 'MODERATOR',
      status: 'ACTIVE',
      isPilotVerified: true,
      pilotGlider: 'Advance Sigma 11 (EN-C)',
      pilotLicenseNumber: 'BHPPA-SM-04',
      bio: 'Launch Safety Marshal at Billing 2400m Takeoff',
    },
  });

  const partner = await prisma.user.create({
    data: {
      name: 'Himalayan Sky Tandem Adventures',
      username: 'himalayan_sky',
      phone: '+919805011003',
      email: 'ops@himalayansky.in',
      passwordHash: partnerPasswordHash,
      role: 'PARTNER',
      status: 'ACTIVE',
      isPilotVerified: true,
      bio: 'Certified Commercial Tandem Flight & Expeditions Operator in Bir Billing',
    },
  });

  const pilotArun = await prisma.user.create({
    data: {
      name: 'Arun Verma',
      username: 'pilot_arun',
      phone: '+919805011004',
      email: 'arun@flybilling.com',
      passwordHash: pilotPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      isPilotVerified: true,
      pilotGlider: 'Niviuk Artik R (EN-C 2-Liner)',
      bio: 'XC Enthusiast. Chasing 100km triangles across the Dhauladhar range.',
    },
  });

  const pilotSophie = await prisma.user.create({
    data: {
      name: 'Sophie Müller',
      username: 'sophie_fly',
      phone: '+919805011005',
      email: 'sophie@paraglide.eu',
      passwordHash: pilotPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      isPilotVerified: true,
      pilotGlider: 'Nova Mentor 7 Light (EN-B)',
      bio: 'Visiting pilot from Austria, staying at Tibetan Colony for the autumn season.',
    },
  });

  const localDriver = await prisma.user.create({
    data: {
      name: 'Ramesh Taxi Bir',
      username: 'driver_ramesh',
      phone: '+919816022001',
      passwordHash: defaultPasswordHash,
      role: 'MEMBER',
      status: 'ACTIVE',
      bio: 'Bolero 4x4 Driver. 12 years driving Bir-Billing uphill road safely.',
    },
  });

  console.log('Created users successfully.');

  // 2. Create Today's Taxis
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const taxi1 = await prisma.taxiTrip.create({
    data: {
      hostId: localDriver.id,
      pickupLocation: 'Bir Landing Ground (Chougan)',
      destination: 'Billing Take-Off Point (2,430m)',
      tripDate: today,
      pickupTime: '09:00 AM',
      totalSeats: 6,
      availableSeats: 2,
      farePerSeat: 250,
      driverName: 'Ramesh Bolero',
      driverPhone: '+919816022001',
      vehicleNumber: 'HP 68 B 4421',
      vehicleType: 'Mahindra Bolero 4x4 (Roof Rack for Wings)',
      status: 'ALMOST_FULL',
      notes: 'Carrying large roof rack. Can fit 6 heavy glider bags easily.',
    },
  });

  await prisma.taxiBooking.create({
    data: {
      tripId: taxi1.id,
      userId: pilotArun.id,
      passengerCount: 1,
      contactPhone: pilotArun.phone,
      status: 'CONFIRMED',
    },
  });

  await prisma.taxiBooking.create({
    data: {
      tripId: taxi1.id,
      userId: pilotSophie.id,
      passengerCount: 1,
      contactPhone: pilotSophie.phone,
      status: 'CONFIRMED',
    },
  });

  const taxi2 = await prisma.taxiTrip.create({
    data: {
      hostId: pilotArun.id,
      pickupLocation: 'Tibetan Colony Gate (Main Market)',
      destination: 'Billing Take-Off Point (2,430m)',
      tripDate: today,
      pickupTime: '10:30 AM',
      totalSeats: 4,
      availableSeats: 3,
      farePerSeat: 300,
      driverName: 'Kishore Sumo',
      driverPhone: '+919816033445',
      vehicleNumber: 'HP 68 A 1290',
      vehicleType: 'Tata Sumo Gold',
      status: 'OPEN',
      notes: 'Heading up for mid-morning thermal cycle. Plenty of room.',
    },
  });

  await prisma.taxiBooking.create({
    data: {
      tripId: taxi2.id,
      userId: pilotArun.id,
      passengerCount: 1,
      contactPhone: pilotArun.phone,
      status: 'CONFIRMED',
    },
  });

  const taxi3 = await prisma.taxiTrip.create({
    data: {
      hostId: moderator.id,
      pickupLocation: 'Northern Cafe (Upper Bir)',
      destination: 'Billing Take-Off Point (2,430m)',
      tripDate: today,
      pickupTime: '12:00 PM',
      totalSeats: 5,
      availableSeats: 0,
      farePerSeat: 250,
      driverName: 'Suraj Camper',
      driverPhone: '+919816099887',
      vehicleNumber: 'HP 68 C 8812',
      vehicleType: 'Bolero Camper 4WD',
      status: 'FULL',
      notes: 'Official association gear transport and solo pilots. Full cabin.',
    },
  });

  console.log('Created taxi trips.');

  // 3. Community Chat Messages
  const msg1 = await prisma.chatMessage.create({
    data: {
      senderId: admin.id,
      content: '🚨 Weather & Launch Advisory (25 Sept): Billing take-off is clear with smooth 12-14 km/h S-SW breeze. Thermal cycle expected to kick in around 10:45 AM. Tandem slots open.',
      isPinned: true,
      mediaType: 'NONE',
    },
  });

  const msg2 = await prisma.chatMessage.create({
    data: {
      senderId: pilotArun.id,
      content: 'Any pilots planning the Palampur - Dharamshala XC run today? Cloudbase looks promising around 3800m!',
    },
  });

  const msg3 = await prisma.chatMessage.create({
    data: {
      senderId: pilotSophie.id,
      content: 'I joined Ramesh’s 09:00 AM taxi from Chougan Landing Ground. 2 seats left if anyone needs a ride up to launch!',
      replyToId: msg2.id,
    },
  });

  console.log('Created community chat messages.');

  // 4. Lost & Found Items
  await prisma.lostFoundItem.create({
    data: {
      userId: pilotSophie.id,
      type: 'LOST',
      title: 'Baofeng UV-5R Walkie-Talkie (Yellow lanyard)',
      category: 'RADIO',
      description: 'Lost yesterday evening around Chougan Landing Ground near the windsock. Had pilot sticker "OE-098" on the battery pack.',
      itemDate: new Date(),
      location: 'Chougan Landing Ground near Windsock',
      contactPhone: '+919805011005',
      status: 'OPEN',
      photos: JSON.stringify(['/placeholders/radio.svg']),
    },
  });

  await prisma.lostFoundItem.create({
    data: {
      userId: moderator.id,
      type: 'FOUND',
      title: 'GoPro Hero 11 Black in protective case',
      category: 'CAMERA',
      description: 'Found on the grass near East Launch at Billing Takeoff Point. Owner can verify serial number or footage on SD card to claim.',
      itemDate: new Date(),
      location: 'Billing East Launch (Take-off ridge)',
      contactPhone: '+919805011002',
      status: 'OPEN',
      photos: JSON.stringify(['/placeholders/camera.svg']),
    },
  });

  console.log('Created Lost & Found items.');

  // 5. Equipment Marketplace Listings
  await prisma.marketplaceListing.create({
    data: {
      sellerId: pilotArun.id,
      title: 'Gin Bolero 6 (Size M, 85-105kg) - Pristine Condition',
      category: 'PARAGLIDER',
      condition: 'EXCELLENT',
      price: 115000,
      location: 'Bir Tibetan Colony',
      description: 'Only 35 hours airtime, crisply maintained, always concertina packed. No water landings or tree landings. Complete with Gin rucksack and inner stuff sack. Perfect wing for progression pilot.',
      contactPhone: '+919805011004',
      status: 'AVAILABLE',
      photos: JSON.stringify(['/placeholders/glider.svg']),
    },
  });

  await prisma.marketplaceListing.create({
    data: {
      sellerId: pilotSophie.id,
      title: 'Supair Delight 3 Pod Harness (Size M)',
      category: 'HARNESS',
      condition: 'GOOD',
      price: 65000,
      location: 'Northern Cafe, Upper Bir',
      description: 'Comfortable cross-country pod harness. Carbon footplate, integrated cockpit, speed bag in great shape. Clean reserve compartment.',
      contactPhone: '+919805011005',
      status: 'AVAILABLE',
      photos: JSON.stringify(['/placeholders/harness.svg']),
    },
  });

  await prisma.marketplaceListing.create({
    data: {
      sellerId: admin.id,
      title: 'Flymaster Vario SD with Protective Bumper',
      category: 'INSTRUMENTS',
      condition: 'EXCELLENT',
      price: 18500,
      location: 'BHPPA Office, Bir',
      description: 'Ultra sensitive vario with acoustic audio buzzer, altitude recorder, USB cable included. Battery holds charge for 30+ flight hours.',
      contactPhone: '+919805011001',
      status: 'AVAILABLE',
      photos: JSON.stringify(['/placeholders/vario.svg']),
    },
  });

  console.log('Created Marketplace listings.');

  // 6. Partner Application & Approved Digital Permit with QR Code
  const partnerApp = await prisma.partnerApplication.create({
    data: {
      partnerId: partner.id,
      companyName: 'Himalayan Sky Tandem Adventures Pvt. Ltd.',
      contactPerson: 'Sunil Kumar (Chief Pilot)',
      businessType: 'TANDEM_AGENCY',
      registrationNumber: 'HP-TOURISM-KGR-2024/774',
      address: 'Near Gandhi Chowk, Bir Billing, Distt Kangra, HP 176077',
      pilotCount: 8,
      insurancePolicyNo: 'NIC-AVIATION-883921-2026',
      status: 'APPROVED',
      adminNotes: 'All 8 pilots hold valid tandem ratings and biometric equipment inspection certificates. Approved for full seasonal operations.',
      submittedAt: new Date(Date.now() - 7 * 86400000),
      reviewedAt: new Date(),
    },
  });

  await prisma.partnerDocument.create({
    data: {
      applicationId: partnerApp.id,
      docType: 'TOURISM_REGISTRATION',
      title: 'HP Tourism Department Commercial Paragliding License 2026',
      fileUrl: '/api/documents/download?file=hp_tourism_cert.pdf',
      fileSize: 1240000,
      mimeType: 'application/pdf',
    },
  });

  await prisma.partnerDocument.create({
    data: {
      applicationId: partnerApp.id,
      docType: 'INSURANCE_CERTIFICATE',
      title: 'Tandem Passenger Comprehensive Aviation Insurance Policy',
      fileUrl: '/api/documents/download?file=insurance_policy.pdf',
      fileSize: 2450000,
      mimeType: 'application/pdf',
    },
  });

  // Generate QR Code for permit
  const permitNumber = 'HP-BIR-2026-1088';
  const verificationUrl = `http://localhost:3000/verify-permit/${permitNumber}`;
  const qrCodeData = await QRCode.toDataURL(verificationUrl, {
    errorCorrectionLevel: 'H',
    width: 300,
    margin: 2,
    color: { dark: '#082f49', light: '#ffffff' },
  });

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  await prisma.permit.create({
    data: {
      permitNumber,
      applicationId: partnerApp.id,
      partnerId: partner.id,
      issuedDate: new Date(),
      expiryDate,
      scope: 'COMMERCIAL_TANDEM_OPERATIONS',
      qrCodeData,
      status: 'VALID',
      issuedByAdminId: admin.id,
    },
  });

  // Audit log entry for permit issuance
  await prisma.auditLog.create({
    data: {
      adminId: admin.id,
      action: 'APPROVE_AND_ISSUE_PERMIT',
      targetType: 'PERMIT',
      targetId: permitNumber,
      details: 'Approved commercial tandem permit for Himalayan Sky Tandem Adventures Pvt. Ltd.',
    },
  });

  // Notification for partner
  await prisma.notification.create({
    data: {
      userId: partner.id,
      type: 'PERMIT_APPROVED',
      title: 'Digital Permit Approved & Issued! 🪪',
      message: `Your commercial paragliding permit ${permitNumber} has been approved by BHPPA. You can now download or present your digital QR pass.`,
      link: '/permissions',
      isRead: false,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
