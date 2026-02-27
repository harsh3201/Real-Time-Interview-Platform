import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { gsap } from 'gsap';
import Skeleton from '../components/Skeleton';

const Dashboard = () => {
    const { user, getFullProfile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ interviews: 0, bookings: 0, active: 0 });
    const [upcoming, setUpcoming] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);
    const [completion, setCompletion] = useState(0);
    const [loading, setLoading] = useState(true);

    const containerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [intRes, bookRes, profileData] = await Promise.all([
                    api.get('/api/interviews'),
                    api.get('/api/bookings/me'),
                    getFullProfile()
                ]);

                const interviews = intRes.data.interviews || [];
                const bookings = bookRes.data.bookings || [];

                let score = 0;
                if (profileData) {
                    if (profileData.name && profileData.phone) score += 20;
                    if (profileData.degree) score += 20;
                    if (profileData.skills && profileData.skills.length > 0) score += 20;
                    if (profileData.projects && profileData.projects.length > 0) score += 20;
                    if (profileData.resume_url) score += 20;
                }
                setCompletion(score);

                const activeCount = interviews.filter(i => i.status === 'active').length;
                const upcoming5 = interviews.slice(0, 5);

                setStats({
                    interviews: interviews.length,
                    bookings: bookings.length,
                    active: activeCount,
                });
                setUpcoming(upcoming5);
                setRecentBookings(bookings.slice(0, 4));
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                const statTargets = document.querySelectorAll('.animate-stat');
                if (statTargets.length > 0) {
                    gsap.to(statTargets, {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: 'back.out(1.7)',
                        clearProps: 'pointerEvents'
                    });
                }

                const cardTargets = document.querySelectorAll('.animate-card');
                if (cardTargets.length > 0) {
                    gsap.to(cardTargets, {
                        y: 0,
                        opacity: 1,
                        duration: 1,
                        stagger: 0.2,
                        delay: 0.3,
                        ease: 'power3.out',
                        clearProps: 'pointerEvents'
                    });
                }

                const titleTarget = document.querySelector('.page-title-animate');
                if (titleTarget) {
                    gsap.to(titleTarget, {
                        x: 0,
                        opacity: 1,
                        duration: 0.8,
                        ease: 'power2.out'
                    });
                }
            }, containerRef.current);
            return () => ctx.revert();
        }
    }, [loading]);

    const formatDate = (dt) => {
        if (!dt) return 'N/A';
        return new Date(dt).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => (
        <span className={`badge badge-${status}`}>{status}</span>
    );

    if (loading) {
        return (
            <div ref={containerRef} style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <Skeleton width="300px" height="45px" borderRadius="8px" margin="0 0 10px 0" />
                    <Skeleton width="400px" height="20px" borderRadius="4px" />
                </div>

                <Skeleton width="100%" height="100px" borderRadius="15px" margin="0 0 40px 0" />

                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="card" style={{ padding: '24px' }}>
                            <Skeleton width="40px" height="40px" borderRadius="50%" margin="0 0 16px 0" />
                            <Skeleton width="40%" height="32px" margin="0 0 8px 0" />
                            <Skeleton width="70%" height="16px" />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                    {[1, 2].map(i => (
                        <div key={i} className="card" style={{ padding: '24px' }}>
                            <Skeleton width="200px" height="28px" margin="0 0 24px 0" />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[1, 2, 3, 4].map(j => <Skeleton key={j} width="100%" height="70px" borderRadius="12px" />)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef}>
            <div className="page-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div className="page-title-animate" style={{ opacity: 0 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-2px', marginBottom: '8px' }}>
                        Welcome, <span style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {user?.role === 'admin' ? "Platform control center" : "Your interview schedule at a glance"}
                    </p>
                </div>
                <div className="badge" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', padding: '8px 20px', fontSize: '0.9rem' }}>
                    {user?.role === 'admin' ? '👑 Administrator' : '👤 Candidate'}
                </div>
            </div>

            <div className="animate-card card" style={{ marginBottom: '40px', background: 'var(--accent-gradient)', color: '#fff', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>Profile Strength: {completion}%</h2>
                        <p style={{ opacity: 0.9 }}>{completion === 100 ? "🔥 You're all set! Ready for the big league." : "Complete your profile to unlock AI analysis and priority slots."}</p>
                    </div>
                    <Link to="/profile" className="btn" style={{ background: '#fff', color: 'var(--accent-blue)', borderRadius: '100px', fontWeight: 700 }}>Update Now</Link>
                </div>
                <div style={{ height: '12px', background: 'rgba(255,255,255,0.2)', borderRadius: '100px', overflow: 'hidden' }}>
                    <div style={{ width: `${completion}%`, height: '100%', background: '#fff', transition: 'width 1s ease-out' }} />
                </div>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="animate-stat card">
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📋</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{stats.interviews}</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Sessions</div>
                </div>
                <div className="animate-stat card">
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📅</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{stats.bookings}</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Your Bookings</div>
                </div>
                <div className="animate-stat card">
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🟢</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{stats.active}</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Active Rooms</div>
                </div>
                <div className="animate-stat card">
                    <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚡</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{user?.role}</div>
                    <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Current Role</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                <div className="animate-card card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Upcoming Interviews</h2>
                        <Link to="/interviews" className="btn-text">View all slots</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {upcoming.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No sessions scheduled</div>
                        ) : (
                            upcoming.map(item => (
                                <div key={item.id} className="list-item" style={{ padding: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🕒 {formatDate(item.scheduled_time)}</div>
                                    </div>
                                    {getStatusBadge(item.status)}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="animate-card card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>My Recent Bookings</h2>
                        <Link to="/my-bookings" className="btn-text">Manage my bookings</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {recentBookings.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>You haven't booked any slots yet</p>
                                <Link to="/interviews" className="btn btn-secondary btn-sm">Browse slots</Link>
                            </div>
                        ) : (
                            recentBookings.map(item => (
                                <div key={item.booking_id} style={{ padding: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>{item.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🕒 {formatDate(item.scheduled_time)}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {getStatusBadge(item.status)}
                                        {item.status === 'active' && (
                                            <button className="btn btn-primary btn-sm" onClick={() => navigate(`/room/${item.interview_id}`)}>Join</button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="animate-card card" style={{ marginTop: '32px', background: 'var(--text-primary)', color: '#fff', border: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '40px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 2 }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '10px' }}>💡 Pro Tip</div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.4, marginBottom: '8px' }}>
                            "The best interviews are conversations, not interrogations."
                        </h3>
                        <p style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                            Prepare 2-3 stories about challenges you've overcome. Interviewers remember stories, not bullet points.
                        </p>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '280px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2px', color: 'var(--accent-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>⚡ Quick Actions</div>
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '2px solid rgba(255,255,255,0.15)', justifyContent: 'flex-start' }} onClick={() => navigate('/interviews')}>
                            🎯 Browse All Sessions
                        </button>
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '2px solid rgba(255,255,255,0.15)', justifyContent: 'flex-start' }} onClick={() => navigate('/my-bookings')}>
                            📅 View My Bookings
                        </button>
                        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '2px solid rgba(255,255,255,0.15)', justifyContent: 'flex-start' }} onClick={() => navigate('/profile')}>
                            🧠 Update My Profile
                        </button>
                        {user?.role === 'admin' && (
                            <button className="btn" style={{ background: 'var(--accent-primary)', color: 'var(--text-primary)', border: 'none', justifyContent: 'flex-start', fontWeight: 900 }} onClick={() => navigate('/admin')}>
                                👑 Admin Console
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
