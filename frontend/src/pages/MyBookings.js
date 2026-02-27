import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { gsap } from 'gsap';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(null);
    const navigate = useNavigate();
    const { showToast } = useToast();
    const containerRef = useRef(null);

    useEffect(() => {
        fetchBookings();
    }, []);

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.from('.booking-row', {
                    y: 20,
                    opacity: 0,
                    duration: 0.6,
                    stagger: 0.08,
                    ease: 'power3.out'
                });
            }, containerRef);
            return () => ctx.revert();
        }
    }, [loading, bookings]);

    const fetchBookings = async () => {
        try {
            const res = await api.get('/api/bookings/me');
            setBookings(res.data.bookings || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        setCancelling(bookingId);
        try {
            await api.delete(`/api/bookings/${bookingId}`);
            setBookings(prev => prev.filter(b => b.booking_id !== bookingId));
            showToast('Booking cancelled successfully.', 'success');
        } catch (err) {
            showToast(err.response?.data?.message || 'Cancel failed.', 'error');
        } finally {
            setCancelling(null);
        }
    };

    const formatDate = (dt) => {
        if (!dt) return 'N/A';
        return new Date(dt).toLocaleString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    const getCountdown = (dt) => {
        const diff = new Date(dt) - new Date();
        if (diff < 0) return '🔴 Passed';
        const hours = Math.floor(diff / 3600000);
        if (hours < 1) return '🟢 Starting soon!';
        if (hours < 24) return `⏰ In ${hours}h`;
        const days = Math.floor(hours / 24);
        return `📅 In ${days} day${days > 1 ? 's' : ''}`;
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div ref={containerRef}>
            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px', marginBottom: '8px' }}>Your Schedule</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                        {bookings.length > 0 ? `You have ${bookings.length} booked session${bookings.length > 1 ? 's' : ''}.` : 'Manage your booked interview sessions.'}
                    </p>
                </div>
                <button className="btn btn-outline btn-sm" onClick={fetchBookings}>↻ Refresh</button>
            </div>

            {bookings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📅</div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>Nothing scheduled yet</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto 32px' }}>
                        Browse the available interview slots and book your first session today.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/interviews')}>
                        Browse Available Slots →
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {bookings.map((booking) => (
                        <div key={booking.booking_id} className="booking-row card" style={{ padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '6px' }}>{booking.title}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🕒 {formatDate(booking.scheduled_time)}</div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 700, padding: '4px 12px', background: 'var(--bg-secondary)', borderRadius: '100px', border: '1px solid var(--border)' }}>
                                    {getCountdown(booking.scheduled_time)}
                                </div>
                                <span className={`badge badge-${booking.status}`}>{booking.status}</span>

                                {booking.status === 'active' && (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => navigate(`/room/${booking.interview_id}`)}
                                    >
                                        🚀 Join Live
                                    </button>
                                )}
                                {booking.status === 'scheduled' && (
                                    <button
                                        className="btn btn-sm"
                                        style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '2px solid var(--danger)' }}
                                        onClick={() => handleCancel(booking.booking_id)}
                                        disabled={cancelling === booking.booking_id}
                                    >
                                        {cancelling === booking.booking_id ? 'Cancelling...' : 'Cancel'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
