# Seat Booking System

Production-ready full-stack seat booking system built with React, Vanilla CSS, Node.js, Express, MongoDB, Mongoose, JWT authentication, and Socket.io.

## Tech Stack

- Frontend: React + Vite + Vanilla CSS
- Backend: Node.js + Express
- Database: MongoDB + Mongoose
- Auth: JWT
- Realtime: Socket.io

## Folder Structure

```text
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
  utils/
frontend/
  src/
    components/
    context/
    pages/
    services/
    styles/
```

## Features

- Employee and admin registration/login with JWT authentication
- 50-seat layout with 40 fixed seats and 10 floating seats
- Fixed seat assignment support for admins
- 10 squads and batch-based seat rules
- Booking allowed only after 3:00 PM for the next working day
- One user per seat per day and one seat per user per day
- Holiday blocking and leave-based auto release
- Live availability refresh via Socket.io
- Admin analytics, holiday management, user management, and seat assignment tools
- Calendar strip for upcoming working days

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Seats and Availability

- `GET /api/seats`
- `GET /api/availability`
- `GET /api/seats/availability`

### Booking

- `POST /api/book`
- `POST /api/cancel`
- `POST /api/leave`

### Admin

- `POST /api/admin/holiday`
- `DELETE /api/admin/holiday/:holidayId`
- `GET /api/admin/holidays`
- `GET /api/admin/analytics`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `PATCH /api/admin/seats/:seatId/assignment`

## Booking Logic

- `Batch 1`
  - Odd ISO week: Monday to Wednesday
  - Even ISO week: Thursday and Friday
- `Batch 2`
  - Odd ISO week: Thursday and Friday
  - Even ISO week: Monday to Wednesday
- Fixed seats can only be used by the assigned employee on designated batch days
- Floating seats can be booked by any employee
- Holidays and weekends are blocked
- Leave marking removes active booking for that day
- Unique indexes plus transactions/fallback handling protect concurrent booking

## Setup Instructions

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment variables

Create `backend/.env` from `backend/.env.example`

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/seat-booking-system
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
ADMIN_INVITE_TOKEN=replace-with-admin-invite-token
APP_TIMEZONE=Asia/Kolkata
```

Create `frontend/.env` from `frontend/.env.example`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Start MongoDB

Use MongoDB Atlas or a local MongoDB instance. For full transaction support, use a replica set-enabled deployment such as MongoDB Atlas.

### 4. Run the application

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

### 5. Open the app

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`

## Notes

- Seats are auto-seeded on backend startup if none exist
- The frontend uses plain CSS with Flexbox and CSS Grid
- Logout is client-side because JWT is stateless
- The first admin registration requires the `ADMIN_INVITE_TOKEN`
