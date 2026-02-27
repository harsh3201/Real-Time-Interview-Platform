import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { gsap } from 'gsap';
import Navbar from '../components/Navbar';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { forgotPassword, resetPassword } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const cardRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(cardRef.current, {
                y: 60, opacity: 0, duration: 1.2, ease: 'power4.out'
            });
            gsap.from('.auth-header > *', {
                y: 20, opacity: 0, duration: 0.8, stagger: 0.15, delay: 0.4, ease: 'power3.out'
            });
        });
        return () => ctx.revert();
    }, [step]);

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await forgotPassword(email);
            showToast('OTP sent to your email!', 'success');
            setStep(2);
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send OTP. Please check your email.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showToast('Passwords do not match.', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('Password must be at least 8 characters.', 'error');
            return;
        }

        const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passRegex.test(newPassword)) {
            showToast('Password must contain at least 1 special character and 1 number.', 'error');
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            showToast('Password reset successful! Redirecting to login...', 'success');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            showToast(err.response?.data?.message || 'Reset failed. Check your OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative' }}>
            <Navbar />
            <div className="auth-page">
                <div className="bg-mesh" />
                <div className="grid-overlay" />

                <div className="auth-card" ref={cardRef}>
                    <div className="auth-header" style={{ marginBottom: '30px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{step === 1 ? '🔒' : '🔑'}</div>
                        <h1 className="auth-title" style={{ fontSize: '2.5rem' }}>
                            {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                        </h1>
                        <p className="auth-subtitle">
                            {step === 1
                                ? "Don't worry, it happens to the best of us."
                                : `Enter the 6-digit code sent to ${email}`}
                        </p>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleRequestOTP}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="reset-email">Email Address</label>
                                <input
                                    id="reset-email" type="email" className="form-input"
                                    placeholder="your@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Sending...' : 'Send Reset Code'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleResetPassword}>
                            <div className="form-group">
                                <label className="form-label">OTP Code</label>
                                <input
                                    type="text" className="form-input"
                                    placeholder="000000" maxLength="6"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    required autoFocus
                                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px' }}
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"} className="form-input"
                                        placeholder="Min 8 chars + 1 spec + 1 num"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? "👁️" : "👁️‍🗨️"}
                                    </button>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Confirm New Password</label>
                                <div className="password-input-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"} className="form-input"
                                        placeholder="Repeat new password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                                <button type="button" className="btn-text" onClick={() => setStep(1)}>
                                    ← Change email address
                                </button>
                            </div>
                        </form>
                    )}

                    <div className="auth-link" style={{ marginTop: '24px' }}>
                        Remembered it? <Link to="/login">Back to Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
