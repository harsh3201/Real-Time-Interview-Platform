# Real-Time Interview Platform 🎯

A full-stack interview scheduling platform with real-time room status using Socket.io.

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)](https://postgresql.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-4-black)](https://socket.io)

## 🚀 Features

| Feature | Description |
|---------|-------------|
| ✅ JWT Auth | Register/Login with role-based access (Candidate & Admin) |
| 📋 Interview CRUD | Admins can create, edit, delete interview slots |
| 📅 Booking System | Candidates can book available interview slots |
| 🟢 Real-Time Rooms | Live room status with Socket.io (join/leave/chat) |
| 📚 Swagger Docs | Full API documentation at `/api/docs` |
| 🧪 Jest Tests | Auth, Interview, and Booking tests |

## 🗂️ Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # DB & Swagger config
│   │   ├── controllers/   # Auth, Interview, Booking
│   │   ├── middleware/    # JWT auth middleware
│   │   ├── routes/        # Express routes (with Swagger)
│   │   ├── socket/        # Socket.io handler
│   │   └── index.js       # Express server entry
│   ├── database/
│   │   ├── schema.sql     # PostgreSQL schema + seed
│   │   └── migrate.js     # Migration runner
│   └── tests/             # Jest + Supertest tests
│
└── frontend/
    └── src/
        ├── context/       # Auth Context
        ├── components/    # Navbar, ProtectedRoute
        ├── pages/         # Login, Register, Dashboard, Interviews, Room, Admin
        └── services/      # Axios API client, Socket.io client
```

## 🛠️ Tech Stack

**Backend:** Node.js, Express, PostgreSQL, JWT, Socket.io, Swagger  
**Frontend:** React 18, React Router v6, Axios, Socket.io-client  
**Testing:** Jest, Supertest  

## 📦 Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Install

```bash
git clone https://github.com/harsh3201/Real-Time-Interview-Platform.git
cd Real-Time-Interview-Platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:
```ini
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/interview_platform
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Database Setup

```bash
# Create the database
psql -U postgres -c "CREATE DATABASE interview_platform;"

# Run migrations (creates tables + seed data)
node database/migrate.js
```

### 4. Frontend Setup

```bash
cd ../frontend
npm install
# .env is already set to http://localhost:5000
```

### 5. Run

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm start
```

App runs at: http://localhost:3000  
API at: http://localhost:5000  
Swagger: http://localhost:5000/api/docs

## 🔐 Test Credentials (after migration)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@interview.com | admin123 |
| Candidate | alice@example.com | admin123 |
| Candidate | bob@example.com | admin123 |

## 📡 API Endpoints

### Auth
| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | ❌ |
| POST | `/api/auth/login` | ❌ |
| GET | `/api/auth/profile` | ✅ |

### Interviews
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | `/api/interviews` | ✅ | Any |
| GET | `/api/interviews/:id` | ✅ | Any |
| POST | `/api/interviews` | ✅ | Admin |
| PUT | `/api/interviews/:id` | ✅ | Admin |
| DELETE | `/api/interviews/:id` | ✅ | Admin |

### Bookings
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| POST | `/api/bookings` | ✅ | Any |
| GET | `/api/bookings/me` | ✅ | Any |
| GET | `/api/bookings/all` | ✅ | Admin |
| DELETE | `/api/bookings/:id` | ✅ | Owner |

### Socket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `room:join` | Client → Server | Join interview room |
| `room:leave` | Client → Server | Leave interview room |
| `room:status` | Server → Client | Room status update |
| `room:message` | Bi-directional | Chat message |
| `rooms:status` | Server → Client | All rooms status on connect |

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover:
- Login returns JWT token
- Register creates user
- Admin can create interview
- Candidate cannot create interview (403)
- Booking requires auth (401)
- Duplicate booking returns 409

## 🐳 Docker (Optional)

```bash
docker-compose up -d
```

## 📸 Screenshots

Login → Dashboard → Interviews → Room

## 📝 License

MIT
