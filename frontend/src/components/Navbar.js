import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { gsap } from 'gsap';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const navRef = useRef(null);

    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMenuOpen(false);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMenuOpen(false);
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Morning';
        if (hour < 17) return 'Afternoon';
        return 'Evening';
    };

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} ref={navRef}>
                <div className="navbar-inner">
                    <NavLink to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ backgroundColor: 'var(--accent-blue)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: 900, fontSize: '0.8rem' }}>HFY</div>
                        <span className="brand-text">interview<span style={{ color: 'var(--accent-blue)' }}>hub</span></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', opacity: 0.6 }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                            <span style={{ fontSize: '0.6rem', fontWeight: 800 }}>LIVE</span>
                        </div>
                    </NavLink>


                    <div
                        className="navbar-nav"
                        style={user ? { position: 'absolute', left: '50%', transform: 'translateX(-50%)' } : { marginLeft: 'auto' }}
                    >
                        {user ? (
                            <>
                                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                                <NavLink to="/interviews" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Interviews</NavLink>
                                {user?.role === 'admin' && (
                                    <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Console</NavLink>
                                )}
                            </>
                        ) : (
                            <>
                                <NavLink to="/login" className="nav-link" style={{ fontWeight: 800 }}>Login</NavLink>
                                <NavLink to="/register" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '100px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>JOIN NOW</NavLink>
                            </>
                        )}
                    </div>


                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {user && (
                            <div className="navbar-user">
                                <NavLink to="/profile" className="user-badge" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--border)', padding: '5px 15px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit' }}>
                                    <div className="user-avatar" style={{ background: 'var(--accent-primary)', border: '1px solid var(--border)', color: 'white', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '0.8rem', fontWeight: 900 }}>
                                        {getInitials(user.name)}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.6, lineHeight: 1 }}>Good {getGreeting()}</span>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>{user.name.split(' ')[0]}</span>
                                    </div>
                                </NavLink>
                                <button className="nav-link" onClick={handleLogout} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
                                    Logout
                                </button>
                            </div>
                        )}


                        <button
                            className="hamburger-btn"
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="Toggle menu"
                            style={{
                                display: 'none',
                                background: 'none',
                                border: '2px solid var(--border)',
                                borderRadius: '6px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                flexDirection: 'column',
                                gap: '4px',
                            }}
                        >
                            <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--text-primary)', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
                            <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--text-primary)', opacity: menuOpen ? 0 : 1, transition: 'all 0.3s' }} />
                            <span style={{ display: 'block', width: '18px', height: '2px', background: 'var(--text-primary)', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
                        </button>
                    </div>
                </div>
            </nav>


            {menuOpen && (
                <div style={{
                    position: 'fixed',
                    top: '60px',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-primary)',
                    borderBottom: '2px solid var(--border)',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px 5%',
                    gap: '8px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }}>
                    {user ? (
                        <>
                            <NavLink to="/dashboard" onClick={() => setMenuOpen(false)} style={{ padding: '12px', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)' }}>📊 Dashboard</NavLink>
                            <NavLink to="/interviews" onClick={() => setMenuOpen(false)} style={{ padding: '12px', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)' }}>🎯 Interviews</NavLink>
                            <NavLink to="/my-bookings" onClick={() => setMenuOpen(false)} style={{ padding: '12px', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)' }}>📅 My Bookings</NavLink>
                            <NavLink to="/profile" onClick={() => setMenuOpen(false)} style={{ padding: '12px', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)' }}>👤 Profile</NavLink>
                            {user?.role === 'admin' && (
                                <NavLink to="/admin" onClick={() => setMenuOpen(false)} style={{ padding: '12px', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)' }}>👑 Admin Console</NavLink>
                            )}
                            <button onClick={handleLogout} style={{ padding: '12px', fontWeight: 700, background: 'none', border: 'none', color: 'var(--danger)', textAlign: 'left', cursor: 'pointer', fontSize: '1rem' }}>🚪 Logout</button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" onClick={() => setMenuOpen(false)} style={{ padding: '12px', fontWeight: 700, textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)' }}>🔑 Login</NavLink>
                            <NavLink to="/register" onClick={() => setMenuOpen(false)} style={{ padding: '12px', fontWeight: 700, textDecoration: 'none', color: 'var(--accent-blue)' }}>✨ Create Account</NavLink>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default Navbar;
