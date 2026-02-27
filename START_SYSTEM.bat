@echo off
TITLE INTERVIEW PLATFORM - MASTER STARTUP
echo ===================================================
echo 🚀 INITIALIZING FULL INTERVIEW SYSTEM
echo ===================================================

echo 🔍 Step 1: Cleaning up existing ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    if NOT "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    if NOT "%%a"=="0" taskkill /F /PID %%a >nul 2>&1
)
echo ✅ Cleanup Complete.

echo 📡 Step 2: Launching Backend Engine...
start cmd /k "cd backend && echo 🟢 BACKEND ACTIVE && npm run dev"

echo 💻 Step 3: Launching Frontend Interface...
start cmd /k "cd frontend && echo 🔵 FRONTEND ACTIVE && npm start"

echo ===================================================
echo ✨ SYSTEM DEPLOYED SUCCESSFULLY
echo 🔗 Backend: http://localhost:5000
echo 🔗 Frontend: http://localhost:3000
echo ===================================================
pause
