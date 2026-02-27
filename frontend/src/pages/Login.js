import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { gsap } from 'gsap';
import Navbar from '../components/Navbar';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('password');
    const [showPassword, setShowPassword] = useState(false);

    const { login, requestOTP, verifyOTP, handleOAuthToken } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const location = useLocation();

    const cardRef = useRef(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(cardRef.current, {
                scale: 0.9, opacity: 0, duration: 1, ease: 'power4.out'
            });
            gsap.from('.auth-header > *', {
                y: 20, opacity: 0, duration: 0.8, stagger: 0.2, delay: 0.3, ease: 'power3.out'
            });
        });

        return () => {
            ctx.revert();
        };
    }, []);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const token = query.get('token');
        if (token) {
            setLoading(true);
            handleOAuthToken(token)
                .then(user => {
                    showToast('Welcome back!', 'success');
                    navigate(user.role === 'admin' ? '/admin' : '/dashboard');
                })
                .catch(() => {
                    showToast('OAuth login failed', 'error');
                    setLoading(false);
                });
        }
    }, [location, handleOAuthToken, navigate]);

    const handlePasswordLogin = async (e) => {
        e.preventDefault();

        // Password Validation: min 8, 1 special char, 1 number
        const passRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        if (!passRegex.test(password)) {
            showToast('Password must be at least 8 characters and contain 1 special character and 1 number.', 'error');
            return;
        }

        setLoading(true);
        try {
            const user = await login(email, password);
            showToast(`Welcome back, ${user.name}!`, 'success');
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            showToast(err.response?.data?.message || 'Login failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await requestOTP(email);
            showToast('OTP sent to your email!', 'success');
            setView('otp_verify');
        } catch (err) {
            showToast(err.response?.data?.message || 'Failed to send OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const user = await verifyOTP(email, otp);
            showToast('Welcome!', 'success');
            navigate(user.role === 'admin' ? '/admin' : '/dashboard');
        } catch (err) {
            showToast(err.response?.data?.message || 'Invalid OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5000/api/auth/google';
    };

    const handleHover = (enter) => {
        const follower = document.querySelector('.custom-cursor-follower');
        gsap.to(follower, { scale: enter ? 2 : 1, background: enter ? 'rgba(0, 242, 255, 0.1)' : 'transparent' });
    };

    return (
        <div className="auth-page-container">
            <Navbar />
            <div className="auth-page-main">
                <div className="bg-mesh" />
                <div className="grid-overlay" />

                <div className="auth-card" ref={cardRef}>
                    <div className="auth-header">
                        <div className="brand-logo-icon">🎯</div>
                        <h1 className="auth-title">Welcome back</h1>
                        <p className="auth-subtitle">Login to your interview hub</p>
                    </div>

                    <div className="auth-content-box">
                        {view === 'password' && (
                            <form onSubmit={handlePasswordLogin} className="auth-form">
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="name@company.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
                                        <Link to="/forgot-password" onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)} style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none', fontWeight: 700 }}>Forgot?</Link>
                                    </div>
                                    <div className="password-input-wrapper">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            className="form-input"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
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
                                <button type="submit" className="btn btn-primary btn-full" disabled={loading} onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)}>
                                    {loading ? 'Authenticating...' : 'Sign In Now'}
                                </button>

                                <div className="auth-action-row">
                                    <button type="button" className="btn-text" onClick={() => setView('otp_request')}>
                                        Login with OTP instead
                                    </button>
                                </div>
                            </form>
                        )}

                        {view === 'otp_request' && (
                            <form onSubmit={handleRequestOTP} className="auth-form">
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>Send Login Code</button>
                                <div className="auth-action-row">
                                    <button type="button" className="btn-text" onClick={() => setView('password')}>Back to Password</button>
                                </div>
                            </form>
                        )}

                        {view === 'otp_verify' && (
                            <form onSubmit={handleVerifyOTP} className="auth-form">
                                <div className="form-group">
                                    <label className="form-label">Verification Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        maxLength="6"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        required
                                        autoFocus
                                        style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }}
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>Confirm Code</button>
                            </form>
                        )}

                        <div className="auth-divider">
                            <span>OR CONTINUE WITH</span>
                        </div>

                        <div className="social-auth-box">
                            <button className="btn btn-outline btn-full social-btn" onClick={handleGoogleLogin} onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)}>
                                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="Google" style={{ width: '20px' }} />
                                <span>Google Workspace</span>
                            </button>
                        </div>

                        <div className="auth-footer-link">
                            New here? <Link to="/register" onMouseEnter={() => handleHover(true)} onMouseLeave={() => handleHover(false)}>Create a free account</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
