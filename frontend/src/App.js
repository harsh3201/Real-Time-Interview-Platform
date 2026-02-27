import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Interviews from './pages/Interviews';
import MyBookings from './pages/MyBookings';
import InterviewRoom from './pages/InterviewRoom';
import AdminPanel from './pages/AdminPanel';
import CustomCursor from './components/CustomCursor';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';



const AppLayout = () => {
  return (
    <div className="app-layout">
      <div className="bg-grid-overlay" />
      <Navbar />
      <main className="main-content" style={{ marginTop: '80px', padding: '0', position: 'relative', zIndex: 1 }}>
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CustomCursor />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/interviews" element={<Interviews />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/room/:id" element={<InterviewRoom />} />
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
