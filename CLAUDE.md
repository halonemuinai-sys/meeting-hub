# MRA Corporate Meeting Room Booking System (Meeting Hub)
> Architectural Guide, Technical Specifications, and Handover Reference for Claude / VS Code AI Assistants and Engineering Team.

---

## 📌 Project Overview
**MRA Meeting Hub** is an enterprise multi-entity meeting room reservation platform for **MRA Group** (**PT Mugi Rekso Abadi**, **PT Mogems Putri International**, and **MRA Media**). It adopts design patterns and calendar UX from **HR HUB (Interview Calendar)**, built with Next.js 15 App Router, Express.js backend, and Prisma ORM targeting an isolated PostgreSQL schema on Supabase.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Port / Connection | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons | `http://localhost:3007` | Interactive Calendar (Timeline, Week, Month, Agenda), Booking Modals, Filters, GA Setup, English UI |
| **Backend** | Node.js, Express.js, Prisma ORM, JSON Web Token (JWT), Nodemailer, ical-generator | `http://localhost:5007` | REST API, Anti-Collision Validation Engine, ICS calendar generator, Confidential masking, Auth |
| **Database** | PostgreSQL on Supabase Cloud (`aws-1-ap-southeast-1.pooler.supabase.com:5432`) | Schema: `mra_meeting_room` | Multi-schema isolated tables: `Company`, `Room`, `Booking`, `User` |

---

## 🏛️ Master Data: Entities & Meeting Rooms

| Entity | Meeting Room | Floor / Location | Capacity | Default Amenities |
| :--- | :--- | :--- | :---: | :--- |
| **PT Mogems Putri International** | Ruang Meeting Lt 10 | 10th Floor | 7 – 9 Pax | Smart TV 65", Polycom Conference, Glass Whiteboard, WiFi 6 |
| **PT Mugi Rekso Abadi (Holding)** | Ruang Meeting A | **8th Floor (Lt 8)** | 14 – 20 Pax | Dual Screen Projector, 4K Video Conf, Surround Mic, Whiteboard |
| **PT Mugi Rekso Abadi (Holding)** | Ruang Meeting B | **8th Floor (Lt 8)** | 4 – 6 Pax | Smart TV 55", Whiteboard, Extension Power Bar |
| **PT Mugi Rekso Abadi (Holding)** | Ruang Meeting C | **8th Floor (Lt 8)** | 8 – 12 Pax | Smart TV 65", Soundbar Mic, Whiteboard, Air Purifier |
| **MRA Media** | R. Meeting Diamond | Media Wing / Studio | 12 – 15 Pax | Acoustic Soundproofing, Large Media Display, Studio Mics |

> **Crucial Rule**: Ruang Meeting A, B, and C are located on the **8th Floor (Lt 8)** of MRA Holding.

---

## ⚙️ Core Modules & Business Logic

### 1. Multi-View Calendar Engine (`frontend/src/components/calendar/`)
- **Room Timeline View (`RoomTimelineView.tsx`)**: Side-by-side room columns with vertical time slots (08:00 – 19:00 WIB). Click any empty slot for instant booking pre-filled with that room and time.
- **Week View (`WeekView.tsx`)**: 7-day view with an algorithmic lane packer (`layout()`) to render overlapping simultaneous bookings without visual collision.
- **Month View (`MonthView.tsx`)**: 35-day corporate calendar grid with daily event chips and badge counters.
- **Agenda View (`AgendaView.tsx`)**: Chronological stream of upcoming meetings grouped by day.

### 2. Category System (`category` field)
- **Presets**: `Weekly Meeting`, `Bi-weekly Meeting`, `Monthly Meeting`, `Quarterly Meeting`, `Interview`, `Townhall / All-Hands`, `Client / Vendor Meeting`, `Ad-hoc / Urgent Meeting`, `General Meeting`.
- **Freeform/Custom Option**: Selecting `✍️ Other (Custom...)` dynamically transforms the dropdown into a text input allowing custom categories.
- **Filter Bar**: Real-time filtering by category in the calendar header filter strip.
- **Color Badges**: Handled via `getCategoryBadge(category)` in `calendarFormat.ts`.

### 3. Confidential Meeting Mode (`isConfidential` field)
- **Checkbox in Booking Modal**: Users can flag a meeting as confidential.
- **Privacy Masking**: If unauthenticated or viewing as a different user:
  - Title is masked to `🔒 Reserved (Private Meeting)`.
  - Description is masked to `Details are confidential and visible only to the meeting organizer.`
  - Organizer and attendees are hidden (`Private Organizer`).
  - Event pill color changes to neutral slate gray.
- **Access Bypass**: The original creator (matched by email/organizer name) or `SUPER_ADMIN` sees full details.

### 4. Strict Anti-Collision Engine (`backend/services/conflictService.js`)
- Validates that no overlapping booking exists for the same room:
  `startTime < existingEnd && endTime > existingStart` (excluding cancelled meetings and the current booking ID when editing).
- Frontend gives instant real-time clash alerts, and the backend performs atomic rejection with HTTP 409 Conflict.

### 5. Meeting Room Management (`RoomsModule.tsx`, `backend/controllers/roomsController.js`)
- Sidebar menu **Facility → Meeting Rooms** (GA Admin & Super Admin): add, edit, deactivate/reactivate, delete.
- Everything else is driven by the `Room` table — timeline columns, booking modal list, filters and the Active Rooms counter adapt automatically to the number of active rooms.
- `GET /api/rooms` returns active rooms only; `?includeInactive=true` is used by the management page.
- Deactivated rooms (`isActive = false`) disappear from the calendar, booking modal and analytics, and cannot be booked; their bookings stay in the database.
- Hard delete is only allowed for rooms with no booking history (HTTP 409 otherwise). Room names must be unique per entity.

### 6. Authentication & Access Control (`backend/controllers/authController.js`)
- JWT-based authentication.
- Quick 1-click demo login buttons on `/login` (seeded password for all: `Admin@123`):
  - **Super Admin**: `admin@mra.co.id`
  - **GA Facility Officer**: `ga.holding@mra.co.id`
  - **Employee**: `user@mra.co.id`
- Role-based permissions (`SUPER_ADMIN`, `GA_ADMIN`, `USER`), enforced in `backend/middleware/auth.js` (`requireAuth`, `requireRole`, `optionalAuth`) and mirrored on the frontend in `frontend/src/lib/permissions.ts` (`can(user, permission)`). Keep both in sync.

### 7. Reports & Room Analytics (`ReportsModule.tsx`, `backend/controllers/analyticsController.js`)
- Sidebar menu **Analytics → Reports & Analytics** (accessible by `SUPER_ADMIN` and `GA_ADMIN`).
- Executive KPI Cards: Total Meetings, Confirmed, Cancelled, Total Runtime Hours, Avg Duration (min), and Avg Pax.
- Visual Analytics:
  - **Room Utilization Ranking**: Bar indicators measuring reserved hours per meeting room.
  - **Peak Hours Heatmap**: Hourly activity volume (08:00 – 19:00 WIB).
  - **Category & Department Distribution**: Breakdown by meeting type and booking departments.
- Detailed Log Table with search filtering and **Export to CSV / Excel** and **Print Report**.

### 8. Forgot Password & Recovery Flow (`/forgot-password`, `mailService.js`)
- 3-step password recovery wizard with work email verification and signed JWT token.
- Issues a 6-digit numeric OTP code valid for 15 minutes sent via branded corporate MRA email.
- Includes a test-mode autofill helper (`devOtp`) for local development without active SMTP credentials.
- Enforces min 6 characters and password confirmation matching.

### 9. Animated Luxury Logout Confirmation (`LogoutModal.tsx`)
- Replaces native browser alerts with a Framer Motion spring-animated executive pop-up.
- Shows signed-in user identity (avatar initials, full name, role badge, company, department, email).
- Provides "Stay Signed In" (secondary) and glowing "Sign Out Now" with loader feedback.

---

## 📂 Project Structure Map

```
d:/MRA Project/MRA Booking Meeting Room/
├── backend/
│   ├── api/
│   │   └── index.js                 # Express app entrypoint & middleware
│   ├── config/
│   │   └── index.js                 # Config loader & environment variables
│   ├── middleware/
│   │   └── auth.js                  # requireAuth / requireRole / optionalAuth (RBAC)
│   ├── controllers/
│   │   ├── authController.js        # Authentication & JWT verification
│   │   ├── bookingsController.js    # CRUD, availability, category & confidential logic
│   │   └── roomsController.js       # Room setup, amenities & maintenance mode
│   ├── prisma/
│   │   └── schema.prisma            # Database schema with mra_meeting_room schema isolation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── bookingsRoutes.js
│   │   └── roomsRoutes.js
│   ├── scripts/
│   │   ├── seed.js                  # Master data & realistic dummy bookings
│   │   └── updateCategories.js      # Category batch updater
│   └── services/
│       ├── conflictService.js       # Anti-collision validation logic
│       └── emailService.js          # RFC 5545 iCalendar (.ics) generator & Nodemailer
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Main calendar dashboard with filter toolbar
│   │   │   ├── login/page.tsx       # Corporate luxury login with quick demo selector
│   │   │   ├── layout.tsx           # Root layout with Sidebar and Top Navigation
│   │   │   └── globals.css          # Tailwind CSS v4 directives
│   │   ├── components/
│   │   │   ├── calendar/
│   │   │   │   ├── RoomTimelineView.tsx
│   │   │   │   ├── WeekView.tsx
│   │   │   │   ├── MonthView.tsx
│   │   │   │   ├── AgendaView.tsx
│   │   │   │   └── calendarFormat.ts  # Types, date helpers, badges & styles
│   │   │   ├── modals/
│   │   │   │   ├── BookingModal.tsx       # New booking form (category + confidential toggle)
│   │   │   │   ├── BookingDetailModal.tsx # View meeting details & cancellation
│   │   │   │   ├── RoomFormModal.tsx      # Add / edit room (entity, capacity, color, amenities, maintenance)
│   │   │   │   ├── AmenitiesMasterModal.tsx
│   │   │   │   ├── UserAccessModal.tsx
│   │   │   │   └── AttendeesDirectoryModal.tsx
│   │   │   ├── modules/             # Rooms, Amenities, Attendees, Users & Access admin pages
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx      # Dark HR HUB-style sidebar, menu filtered by permission
│   │   │       └── TopBar.tsx       # Header with sidebar toggle & sign in / out
│   │   └── lib/
│   │       ├── api.ts               # API client (sends Bearer token)
│   │       └── permissions.ts       # can(user, permission) — mirrors backend RBAC
│   └── package.json
├── .gitignore                       # Standard Git ignore (protects .env and node_modules)
├── CLAUDE.md                        # This technical handover guide
├── package.json                     # Root orchestrator scripts
└── README.md                        # High-level overview
```

---

## 🛠️ Development & Operational Commands

### 1. Starting Services
```bash
# Terminal 1: Backend (Port 5007)
cd backend
npm run dev

# Terminal 2: Frontend (Port 3007)
cd frontend
npm run dev
```

### 2. Database & Prisma Commands
```bash
cd backend

# Sync schema changes to Supabase PostgreSQL without migration files:
npx prisma db push --skip-generate

# Generate Prisma Client:
# IMPORTANT: On Windows, stop the running backend process first to avoid DLL file locks!
npx prisma generate

# Re-seed initial master data and demo bookings:
node scripts/seed.js
```

### 3. Environment Variables (`backend/.env`)
```ini
PORT=5007
NODE_ENV=development
JWT_SECRET=mra_meeting_room_secret_token_key_2026_super_secure
CORS_ORIGIN=http://localhost:3007

# PostgreSQL Supabase Connection
DATABASE_URL="postgresql://postgres.xxx:pass@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?options=-csearch_path%3Dmra_meeting_room,public&sslmode=require"
DIRECT_URL="postgresql://postgres.xxx:pass@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?options=-csearch_path%3Dmra_meeting_room,public&sslmode=require"

MAIL_MODE=log
SMTP_HOST=smtp.bizmail.yahoo.com
SMTP_PORT=465
SMTP_USER=helpdesk@mraretail.co.id
SMTP_PASS=
SMTP_FROM=helpdesk@mraretail.co.id
APP_URL=http://localhost:3007
```

---

## ⚠️ Important Windows & Prisma Quirks
- **Prisma Windows DLL Lock**: When running `npx prisma generate` on Windows while `node api/index.js` or `npm run dev` is active, Windows will lock `query_engine-windows.dll.node` and return an `EBUSY / EPERM` error. Always terminate the backend process before generating the client, then restart it.
- **Language Policy**: All UI text, tooltips, dialogs, validation messages, and badges **must remain strictly in professional English**.
- **Floor Numbering**: Remember that Ruang Meeting A, B, and C in MRA Holding are specifically located on **8th Floor (Lt 8)**.
