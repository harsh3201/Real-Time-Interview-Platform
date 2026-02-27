import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { gsap } from 'gsap';
import Navbar from '../components/Navbar';

const Register = () => {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
    const [loading, setLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [showOTP, setShowOTP] = useState(false);
    const { register, verifyOTP, requestOTP } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const cardRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(cardRef.current, {
                y: 60,
                opacity: 0,
                duration: 1.2,
                ease: 'power4.out'
            });
            gsap.from('.auth-header > *', {
                y: 20,
                opacity: 0,
                duration: 0.8,
                stagger: 0.15,
                delay: 0.4,
                ease: 'power3.out'
            });
        });
        return () => ctx.revert();
    }, [showOTP]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.password.length < 6) {
            showToast('Password must be at least 6 characters.', 'error');
            return;
        }

        setLoading(true);
        try {
            const data = await register(form.name, form.email, form.password, form.role);
            if (data.requiresOTP) {
                showToast('OTP sent to your email!', 'success');
                setShowOTP(true);
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Registration failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await verifyOTP(form.email, otp);
            showToast('Welcome!', 'success');
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid or expired OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            await requestOTP(form.email);
            showToast('OTP resent!', 'success');
        } catch (err) {
            showToast('Failed to resend OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleHover = (enter) => {
        const follower = document.querySelector('.custom-cursor-follower');
        gsap.to(follower, { scale: enter ? 2 : 1, background: enter ? 'rgba(197, 173, 197, 0.2)' : 'transparent', borderColor: enter ? 'transparent' : 'var(--accent-primary)' });
    };

    return (
        <div style={{ position: 'relative' }}>
            <Navbar />
            <div className="auth-page">
                <div className="bg-mesh" />
                <div className="grid-overlay" />
                <div className="auth-card" ref={cardRef}>
                    <div className="auth-header" style={{ marginBottom: '30px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{showOTP ? '📩' : '🚀'}</div>
                        <h1 className="auth-title" style={{ fontSize: '2.5rem' }}>{showOTP ? 'Verify Email' : 'Create Account'}</h1>
                        <p className="auth-subtitle">{showOTP ? `We sent an OTP to ${form.email}` : 'Join thousands of tech professionals'}</p>
                    </div>

                    {!showOTP ? (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-name">Full Name</label>
                                <input
                                    id="reg-name" type="text" className="form-input"
                                    placeholder="e.g. Harsh K."
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required autoFocus
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-email">Email Address</label>
                                <input
                                    id="reg-email" type="email" className="form-input"
                                    placeholder="harsh@example.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-password">Password</label>
                                <input
                                    id="reg-password" type="password" className="form-input"
                                    placeholder="Minimum 6 characters"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="reg-role">I am a...</label>
                                <select
                                    id="reg-role" className="form-input"
                                    style={{ appearance: 'none' }}
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                >
                                    <option value="candidate">👤 Candidate (Interview-ready)</option>
                                    <option value="admin">👑 Recruiter (Manage pipeline)</option>
                                </select>
                            </div>

                            <button type="submit" className={`btn btn-primary btn-full`} disabled={loading} onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)}>
                                {loading ? 'Sending OTP...' : 'Get Started Free ✨'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP}>
                            <div className="form-group">
                                <label className="form-label">6-Digit OTP Code</label>
                                <input
                                    type="text" className="form-input"
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required autoFocus
                                    style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                                />
                            </div>
                            <button type="submit" className={`btn btn-primary btn-full`} disabled={loading} onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)}>
                                {loading ? 'Verifying...' : 'Verify & Setup Account'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button type="button" className="btn-text" onClick={handleResendOTP} disabled={loading}>Resend code</button>
                                <button type="button" className="btn-text" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }} onClick={() => setShowOTP(false)}>Back to Register</button>
                            </div>
                        </form>
                    )}

                    {!showOTP && (
                        <div className="auth-link" style={{ marginTop: '24px' }}>
                            Already on InterviewHub? <Link to="/login">Sign in here</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
