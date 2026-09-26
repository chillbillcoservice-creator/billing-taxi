# 🪂 BILLING TAXI
### Dedicated Mountain Mobility & Paragliding Community Platform for Bir-Billing, Himachal Pradesh

Billing Taxi replaces fragmented WhatsApp and Telegram groups with an integrated, mobile-first Progressive Web Application tailored specifically for pilots, commercial tandem operators, flight schools, and local 4x4 mountain drivers around **Billing Take-Off (2,430m)** and **Bir Landing Site (1,525m)**.

---

## 🌟 Core Modules & Architecture

### 1. 🚕 Taxi Sharing Engine
- **Bir-Billing Presets**: Instant booking with pre-configured pickup spots (*Chougan Landing Ground, Tibetan Colony Gate, Northern Cafe, Bir Road Junction, BHPPA Office, Deer Park*).
- **Seat Concurrency & Integrity**: Transactional database-level seat locking (`prisma.$transaction`) prevents overbooking of Alto, Bolero, and Sumo vehicles.
- **Dynamic Status Progression**: `OPEN` → `ALMOST FULL` (1-2 seats left) → `FULL` → `COMPLETED` / `CANCELLED`.
- **Roster & Contacts**: Complete rider list, driver details, direct phone dialer, and cancellation notifications.

### 2. 💬 Community Chat & Launch Dispatch
- **Centralized Paragliding Wire**: Single high-performance community chat room with real-time streaming/polling.
- **Photo & Video Uploads**: Camera and gallery integration for live launch windsock and weather reports.
- **Replies & Mentions**: Quoted message replies and `@username` auto-detection with in-app notification alerts.
- **Safety Marshal Tools**: Launch marshals and admins can pin weather warnings, delete messages, report violations, and timeout/mute users.

### 3. 🔎 Lost & Found Board
- **Paragliding Equipment Tracking**: Tailored categories for *Radios/Walkie-talkies, Alti-Varios, GoPro cameras, Wings, Harnesses, Flying suits*.
- **Camera/Gallery Uploads**: Multi-photo uploads for identification.
- **Lifecycle Management**: `OPEN` → `CLAIMED` → `RESOLVED` with direct contact options.

### 4. 🪂 Equipment Classifieds Marketplace
- **Glider & Avionics Marketplace**: Wings, Pod Harnesses, Reserves, Helmets, Varios, Flight instruments.
- **Photo Carousels & Condition Badges**: `NEW`, `EXCELLENT`, `GOOD`, `FAIR` with airtime and porosity notes.
- **Direct Contact**: One-tap phone call and WhatsApp inquiry prefilled with equipment details.

### 5. 🪪 Partner Permissions & Digital QR Permit System
- **Commercial Operator Clearance**: Application portal for tandem agencies, flight academies, and equipment distributors.
- **Encrypted Document Vault**: Multi-document upload (Tourism Department Registration, FAI Tandem Pilot Licenses, Annual Inspection Certs, Aviation Insurance) isolated from public access.
- **Admin Review Interface**: Admins can review docs, request changes with notes, approve, reject, and issue official permits.
- **Digital QR Permit**: Automatically generated digital pass with unique Permit Number (`HP-BIR-2026-XXXX`), validity window, and tamper-evident QR code.
- **Public QR Verification**: Instant verification at `/verify-permit/[permitNumber]` for launch marshals and forestry checkpoints.

### 6. 🛡️ Role-Based Access Control (RBAC) & Admin Control
- **Roles**: `MEMBER`, `PARTNER`, `MODERATOR` (Launch Safety Marshal), and `ADMIN` (BHPPA Lead).
- **Admin Dashboard**: Live telemetry, user permission management, audit trail, reports triage, and permit issuance.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v10+

### Installation & Run

```bash
# Navigate to project directory
cd "C:\Users\admin\.gemini\antigravity\scratch\billing-taxi"

# Install dependencies
npm install

# Initialize database & run seed
npx prisma db push
node prisma/seed.js

# Build production bundle
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) on your mobile browser or emulator.

---

## 👥 Pre-Configured Demo Accounts (1-Tap Switch)

For testing and demonstration, use the **1-Tap Role Switcher** on the `/profile` page or log in with:

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `admin123` | BHPPA Lead (Full permit issuance, user control, audit trail) |
| **MODERATOR** | `mod_suresh` | `admin123` | Launch Safety Marshal at Billing Take-off (Pin warnings, report review) |
| **PARTNER** | `himalayan_sky` | `partner123` | Tandem Operator (Permit tracking, document submissions) |
| **PILOT (MEMBER)**| `pilot_arun` | `pilot123` | Solo Pilot (Taxi bookings, marketplace listings, chat) |
| **DRIVER** | `driver_ramesh` | `admin123` | Bolero 4x4 Mountain Driver (Hosts shared rides to Billing) |

---

## 🧪 Automated Test Suite

Run the end-to-end integration test suite:

```bash
node test/e2e-test.js
```
