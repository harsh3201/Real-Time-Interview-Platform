# 🎙️ Real-Time Interview Platform (RTIP)

<div align="center">

![Project Banner](https://img.shields.io/badge/Full--Stack-Interview--Platform-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?style=for-the-badge&logo=postgresql)
![AI Powered](https://img.shields.io/badge/AI-Gemini_Flash-orange?style=for-the-badge&logo=google)

*Empowering the next generation of hiring with AI and Real-time collaboration.*

[Explore Docs](http://localhost:5000/api/docs) · [Report Bug](https://github.com/harsh3201/Real-Time-Interview-Platform/issues) · [Request Feature](https://github.com/harsh3201/Real-Time-Interview-Platform/issues)

</div>

---

## 📖 Table of Contents
- [✨ Key Features](#-key-features)
- [🏗️ System Architecture](#-system-architecture)
- [🛠️ Tech Stack](#-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [📡 API & Socket Events](#-api--socket-events)
- [🧪 Quality Assurance](#-quality-assurance)
- [📸 Preview](#-preview)
- [📄 License](#-license)

---

## ✨ Key Features

<details open>
<summary><b>🤖 AI-Powered Intelligence</b> (Click to collapse)</summary>

- **Deep Profile Analysis:** Leverages **Gemini 1.5 Flash** to parse skills, projects, and experience.
- **Readiness Scoring:** Get a 0-100 score on how prepared a candidate is for a role.
- **Gap Identification:** AI suggests specific areas for improvement and market standing.
</details>

<details>
<summary><b>⚡ Real-Time Engine</b></summary>

- **Live Status Tracking:** See who's online and which interview rooms are active instantly.
- **Bi-directional Chat:** Low-latency communication for interviewers and candidates.
- **Instant Booking:** Slots update across all clients the moment a booking is made.
</details>

<details>
<summary><b>🎨 Visual Excellence</b></summary>

- **GSAP Driven:** Silky smooth animations for transitions and state changes.
- **Responsive Layout:** Desktop-first logic that gracefully scales to mobile.
- **Modern UI:** Glassmorphism and vibrant color palettes for a premium feel.
</details>

---

## 🏗️ System Architecture

```mermaid
graph TD
    User((User/Admin)) -->|React + GSAP| Frontend[Frontend Interface]
    Frontend -->|Socket.io| WS[WebSocket Server]
    Frontend -->|REST API| Express[Express Backend]
    Express -->|SQL| DB[(PostgreSQL)]
    Express -->|API Call| Gemini[Google Gemini AI]
    WS -->|Real-time Updates| Frontend
```

### 🔄 Interview Flow
```mermaid
sequenceDiagram
    participant A as Admin
    participant C as Candidate
    participant S as Server
    A->>S: Create Interview Slot
    S->>C: Push Notification (New Slot)
    C->>S: Book Slot
    S->>A: Update Dashboard
    A->>S: Join Room
    C->>S: Join Room
    S->>A: Real-time Status (C Joined)
    Note over A,C: Live Interview & Chat
```

---

## 🛠️ Tech Stack

| Layer | Primary Tech | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 | Hooks, Context API, GSAP Animations |
| **Backend** | Node.js | Express, Socket.io, Passport JWT |
| **Database** | PostgreSQL | Relational schema with PG-Pool |
| **Artificial Intelligence** | Gemini Flash | Generative AI for candidate parsing |

---

## 🚀 Quick Start

### ⚡ The "One-Click" Method (Windows)
If you are on Windows, simply double-click the master script:
```bash
START_SYSTEM.bat
```
*This handles port cleanup, moves into directories, and boots both servers simultaneously.*

### 🛠️ Manual Configuration

<details>
<summary><b>Step 1: Backend Environment Setup</b></summary>

- `cd backend`
- `npm install`
- Create `.env` with:
  ```ini
  PORT=5000
  DATABASE_URL=postgresql://user:password@localhost:5432/db
  GEMINI_API_KEY=your_key
  JWT_SECRET=your_secret
  ```
</details>

<details>
<summary><b>Step 2: Database Initialization</b></summary>

```bash
node backend/database/migrate.js
```
</details>

<details>
<summary><b>Step 3: Frontend Launch</b></summary>

```bash
cd frontend
npm install
npm start
```
</details>

---

## 📡 API & Socket Events

<details>
<summary><b>🔐 Authentication Endpoints</b></summary>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create new account |
| `POST` | `/api/auth/login` | Receive JWT Token |
| `GET` | `/api/auth/profile` | Fetch authenticated user data |
| `GET` | `/api/ai/analyze` | AI Profile Evaluation |
</details>

<details>
<summary><b>💬 WebSocket Events (Socket.io)</b></summary>

| Event | Origin | Effect |
| :--- | :--- | :--- |
| `room:join` | Client | Subscribes to room updates |
| `room:status` | Server | Broadcasts participant changes |
| `room:message` | Both | Sends/Receives live chat |
</details>

---

## 🧪 Quality Assurance

We maintain code quality through exhaustive integration testing:
```bash
cd backend && npm test
```

---

## 📸 Preview

| Feature | Visual |
| :--- | :--- |
| **Admin Panel** | ![Dashboard](docs/images/admin_dashboard.png) |
| **AI Analysis** | ![AI](docs/images/ai_analysis.png) |
| **Live Room** | ![Room](docs/images/live_room.png) |

---

## 📄 License
Distributed under the **MIT License**. See `LICENSE` for more information.

---
**Developed with ❤️ by [Harsh](https://github.com/harsh3201)**
