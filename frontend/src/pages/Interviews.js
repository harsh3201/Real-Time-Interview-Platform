import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../services/socket';
import api from '../services/api';
import { gsap } from 'gsap';
import Skeleton from '../components/Skeleton';

const Interviews = () => {
    useAuth();
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bookingId, setBookingId] = useState(null);
    const { showToast } = useToast();
    const [filter, setFilter] = useState('all');
    const [roomStatuses, setRoomStatuses] = useState({});
    const [myBookings, setMyBookings] = useState([]);

    const containerRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const [intRes, bookRes] = await Promise.all([
                api.get('/api/interviews'),
                api.get('/api/bookings/me'),
            ]);
            setInterviews(intRes.data.interviews || []);
            setMyBookings((bookRes.data.bookings || []).map(b => b.interview_id));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const socket = getSocket();
        if (socket) {
            socket.on('room:updated', ({ interview_id, active, participants }) => {
                setRoomStatuses(prev => ({ ...prev, [interview_id]: { active, participants } }));
            });
            socket.on('rooms:status', (statuses) => {
                setRoomStatuses(statuses);
            });
        }
        return () => {
            if (socket) {
                socket.off('room:updated');
                socket.off('rooms:status');
            }
        };
    }, [fetchData]);

    useEffect(() => {
        if (!loading && interviews.length > 0) {
            const ctx = gsap.context(() => {
                const targets = document.querySelectorAll('.animate-card');
                if (targets.length > 0) {
                    gsap.to(targets, {
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.1,
                        ease: 'power3.out',
                        clearProps: 'pointerEvents'
                    });
                }
            }, containerRef.current);
            return () => ctx.revert();
        }
    }, [loading, filter, interviews]);

    const handleBook = async (interviewId) => {
        setBookingId(interviewId);
        try {
            await api.post('/api/bookings', { interview_id: interviewId });
            showToast('Interview booked successfully!', 'success');
            setMyBookings(prev => [...prev, interviewId]);
        } catch (err) {
            showToast(err.response?.data?.message || 'Booking failed.', 'error');
        } finally {
            setBookingId(null);
        }
    };

    const formatDate = (dt) => {
        const date = new Date(dt);
        const now = new Date();
        const diff = date - now;
        const days = Math.floor(diff / 86400000);
        const formatted = date.toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
        let relative = diff < 0 ? 'Past' : days === 0 ? '📍 Today' : days === 1 ? '⏰ Tomorrow' : `📅 In ${days} days`;
        return { formatted, relative };
    };

    const filtered = filter === 'all' ? interviews : interviews.filter(i => i.status === filter);

    if (loading) {
        return (
            <div ref={containerRef} style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
                <div style={{ marginBottom: '40px' }}>
                    <Skeleton width="400px" height="45px" borderRadius="8px" margin="0 0 10px 0" />
                    <Skeleton width="300px" height="20px" borderRadius="4px" />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} width="100px" height="36px" borderRadius="100px" />)}
                </div>

                <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="card" style={{ padding: '24px', height: '300px', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <Skeleton width="60%" height="24px" />
                                <Skeleton width="80px" height="24px" borderRadius="100px" />
                            </div>
                            <Skeleton width="80%" height="16px" margin="0 0 12px 0" />
                            <Skeleton width="50%" height="16px" margin="0 0 12px 0" />
                            <Skeleton width="70%" height="16px" margin="0 0 24px 0" />
                            <div style={{ marginTop: 'auto' }}>
                                <Skeleton width="100%" height="45px" borderRadius="12px" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef}>
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Available Sessions</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Browse and book your next interview slot.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
                {['all', 'scheduled', 'active', 'completed', 'cancelled'].map(f => (
                    <button
                        key={f}
                        className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px 20px' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔍</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>No interviews found</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>Try adjusting your filters or check back later.</p>
                </div>
            ) : (
                <div className="grid-container">
                    {filtered.map(interview => {
                        const { formatted, relative } = formatDate(interview.scheduled_time);
                        const isBooked = myBookings.includes(interview.interview_id || interview.id);
                        const roomStatus = roomStatuses[interview.interview_id || interview.id];
                        const isActive = interview.status === 'active' || roomStatus?.active;

                        return (
                            <div className="animate-card card" key={interview.id} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, flex: 1 }}>{interview.title}</h3>
                                    <span className={`badge badge-${interview.status}`}>{interview.status}</span>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span>📅</span> {formatted}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        <span>⏰</span> {relative}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <span>👥</span> {interview.booking_count || 0} participants booked
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                                    {isBooked ? (
                                        <>
                                            <div style={{ flex: 1, padding: '12px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius-md)', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                                                ✅ Booked
                                            </div>
                                            {(isActive || interview.status === 'scheduled') && (
                                                <button className="btn btn-primary" onClick={() => navigate(`/room/${interview.id}`)}>
                                                    Join Room
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <button
                                            className="btn btn-primary btn-full"
                                            onClick={() => handleBook(interview.id)}
                                            disabled={bookingId === interview.id || interview.status !== 'scheduled'}
                                        >
                                            {bookingId === interview.id ? 'Booking...' : interview.status !== 'scheduled' ? 'Unavailable' : 'Book Now'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Interviews;
