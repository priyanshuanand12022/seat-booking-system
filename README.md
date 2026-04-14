# Seat Booking System

A production-ready full-stack seat booking platform for hybrid offices. The app supports JWT authentication, fixed and floating desk allocation, squad and batch scheduling rules, holiday management, leave handling, analytics, and real-time seat availability updates.

## Project Overview

This project is designed around a real workplace seat-planning scenario:

- 50 seats total
- 40 fixed seats assigned to specific employees
- 10 floating seats available to everyone
- 10 squads with up to 8 members each
- 2 rotating office batches with rule-based seat eligibility
- Admin tools for holidays, analytics, users, and seat assignments

## Highlights

- JWT-based authentication for `Admin` and `Employee`
- Role-aware seat booking with fixed/floating seat rules
- Batch scheduling logic using odd/even ISO week parity
- One user per seat per day and one seat per user per day
- Leave marking with automatic seat release
- Holiday blocking for bookings
- Real-time seat availability with Socket.io
- Responsive React frontend using plain CSS only
- Modular Express + Mongoose backend structure

## Tech Stack

- Frontend: React, Vite, Vanilla CSS
- Backend: Node.js, Express
- Database: MongoDB, Mongoose
- Authentication: JWT
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

## Core Features

### Authentication

- Register and login flows
- Admin and employee roles
- Protected routes and role-based access

### Seat Management

- 50-seat responsive grid layout
- Fixed seats shown separately from floating seats
- Live seat status indicators:
  - Fixed assigned seat: blue
  - Floating seat: green
  - Booked seat: red
  - Available seat: grey

### Booking Rules

- Booking opens only after `3:00 PM`
- Booking is allowed only for the next working day
- Fixed seats can only be used on designated batch days
- Floating seats can be used by any employee
- Holidays and weekends are blocked
- Marking leave automatically removes an active booking
- Leave can also be unmarked from the dashboard

### Admin Tools

- Add and remove holidays
- View booking analytics
- Update user roles, squads, and batches
- Assign fixed seats to employees

## Batch Scheduling Logic

### Batch 1

- Odd ISO week: Monday to Wednesday
- Even ISO week: Thursday and Friday

### Batch 2

- Odd ISO week: Thursday and Friday
- Even ISO week: Monday to Wednesday

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
- `POST /api/leave/unmark`

### Admin

- `POST /api/admin/holiday`
- `DELETE /api/admin/holiday/:holidayId`
- `GET /api/admin/holidays`
- `GET /api/admin/analytics`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `PATCH /api/admin/seats/:seatId/assignment`

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/priyanshuanand12022/seat-booking-system.git
cd seat-booking-system
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

Create these files before starting the app:

- `backend/.env`
- `frontend/.env`

You can copy from:

- `backend/.env.example`
- `frontend/.env.example`

#### Backend environment variables

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `PORT` | Yes | `5000` | Backend server port |
| `CLIENT_URL` | Yes | `http://localhost:5173` | Allowed frontend origin for CORS |
| `MONGO_URI` | Yes | `mongodb://127.0.0.1:27017/seat-booking-system` | MongoDB connection string |
| `JWT_SECRET` | Yes | `replace-with-a-long-random-secret` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | Yes | `1d` | Token expiration |
| `ADMIN_INVITE_TOKEN` | Yes | `replace-with-admin-invite-token` | Required only when registering an admin |
| `APP_TIMEZONE` | Yes | `Asia/Kolkata` | App timezone used for scheduling and booking windows |

Example `backend/.env`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/seat-booking-system
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
ADMIN_INVITE_TOKEN=replace-with-admin-invite-token
APP_TIMEZONE=Asia/Kolkata
```

#### Frontend environment variables

| Variable | Required | Example | Purpose |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | `http://localhost:5000/api` | Backend API base URL |
| `VITE_SOCKET_URL` | Yes | `http://localhost:5000` | Socket.io server URL |

Example `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 4. Start MongoDB

Use one of the following:

- Local MongoDB server
- MongoDB Atlas

For the strongest concurrency behavior, a replica set-enabled deployment such as MongoDB Atlas is recommended.

### 5. Run the app

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

### 6. Open the app

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/api/health`

## Local Development Notes

- Seats are auto-seeded on backend startup if the seat collection is empty
- Local `.env` files are ignored by Git and are not pushed to GitHub
- Logout is client-side because JWT authentication is stateless
- The admin invite token is needed only for admin registration
- If port `5000` is already in use, update `PORT` in `backend/.env` and keep frontend env values in sync

## Suggested GitHub About Text

If you want a clean one-line repository description on GitHub, use:

`Production-ready seat booking system with React, Express, MongoDB, JWT auth, batch scheduling, fixed/floating seats, and real-time availability.`
