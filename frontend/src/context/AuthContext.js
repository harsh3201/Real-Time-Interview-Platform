import React, { createContext, useContext, useState, useEffect } from 'react';
import { initSocket, disconnectSocket } from '../services/socket';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    const initializeAuth = (newToken, newUser) => {
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        initSocket(newToken);
    };

    useEffect(() => {
        const checkAuth = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setToken(storedToken);
                    setUser(parsedUser);
                    initSocket(storedToken);
                } catch {
                    localStorage.clear();
                }
            }
            setLoading(false);
        };
        checkAuth();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/api/auth/login', { email, password });
        initializeAuth(res.data.token, res.data.user);
        return res.data.user;
    };

    const register = async (name, email, password, role) => {
        const res = await api.post('/api/auth/register', { name, email, password, role });
        return res.data;
    };

    const requestOTP = async (email) => {
        return api.post('/api/auth/otp/request', { email });
    };

    const verifyOTP = async (email, otp) => {
        const res = await api.post('/api/auth/otp/verify', { email, otp });
        initializeAuth(res.data.token, res.data.user);
        return res.data.user;
    };

    const handleOAuthToken = async (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
        initSocket(newToken);

        try {
            const res = await api.get('/api/auth/profile', {
                headers: { Authorization: `Bearer ${newToken}` }
            });
            const newUser = res.data.user;
            localStorage.setItem('user', JSON.stringify(newUser));
            setUser(newUser);
            return newUser;
        } catch (err) {
            logout();
            throw err;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        disconnectSocket();
        setToken(null);
        setUser(null);
    };

    const updateProfile = async (updates) => {
        const res = await api.put('/api/auth/profile', updates);
        const updatedUser = res.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        return updatedUser;
    };

    const getFullProfile = async () => {
        const res = await api.get('/api/auth/full-profile');
        return res.data.user;
    };

    const saveFullProfile = async (data) => {
        const res = await api.put('/api/auth/full-profile', data);
        const updatedProfile = res.data.profile;

        return updatedProfile;
    };

    const forgotPassword = async (email) => {
        return api.post('/api/auth/forgot-password', { email });
    };

    const resetPassword = async (email, otp, newPassword) => {
        return api.post('/api/auth/reset-password', { email, otp, newPassword });
    };

    return (
        <AuthContext.Provider value={{
            user, token, loading, login, register, logout,
            requestOTP, verifyOTP, handleOAuthToken, updateProfile,
            getFullProfile, saveFullProfile, forgotPassword, resetPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
};
