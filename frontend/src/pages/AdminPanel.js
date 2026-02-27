import React, { useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { gsap } from 'gsap';

const AdminPanel = () => {
    useEffect(() => { }, []);
    const [interviews, setInterviews] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('interviews');
    const [showModal, setShowModal] = useState(false);
    const [editInterview, setEditInterview] = useState(null);
    const [form, setForm] = useState({ title: '', scheduled_time: '', status: 'scheduled' });
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [candidateDetail, setCandidateDetail] = useState(null);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const { showToast } = useToast();
    const containerRef = useRef(null);
    const drawerRef = useRef(null);

    const fetchData = useCallback(async (signal) => {
        try {
            const [intRes, bookRes, userRes] = await Promise.all([
                api.get('/api/interviews', { signal }),
                api.get('/api/bookings/all', { signal }),
                api.get('/api/auth/users', { signal }),
            ]);
            setInterviews(intRes.data.interviews || []);
            setBookings(bookRes.data.bookings || []);
            setUsers(userRes.data.users || []);
        } catch (err) {
            if (err.name !== 'CanceledError') console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);
        return () => controller.abort();
    }, [fetchData]);

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                gsap.from('.stat-card', { scale: 0.9, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'back.out(1.2)', clearProps: 'all' });
            }, containerRef.current);
            return () => ctx.revert();
        }
    }, [loading]);

    useEffect(() => {
        if (!loading) {
            const ctx = gsap.context(() => {
                if (document.querySelector('.table-wrapper')) {
                    gsap.from('.table-wrapper', { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out', clearProps: 'all' });
                }
            }, containerRef.current);
            return () => ctx.revert();
        }
    }, [activeTab, loading]);

    const openCandidateDetail = async (candidate) => {
        setSelectedCandidate(candidate);
        setCandidateDetail(null);
        setCandidateLoading(true);
        try {
            const res = await api.get(`/api/auth/candidates/${candidate.id}`);
            setCandidateDetail(res.data);
        } catch (err) {
            showToast('Failed to load candidate details', 'error');
        } finally {
            setCandidateLoading(false);
            setAnalysisResult(null);
        }
        setTimeout(() => {
            if (drawerRef.current) {
                gsap.from(drawerRef.current, { x: 60, opacity: 0, duration: 0.4, ease: 'power3.out' });
            }
        }, 50);
    };

    const handleGenerateAIAnalysis = async () => {
        if (!selectedCandidate) return;
        setAnalyzing(true);
        try {
            const res = await api.get(`/api/ai/analyze-profile?candidateId=${selectedCandidate.id}`);
            setAnalysisResult(res.data.analysis);
            showToast('AI Strategic Analysis Complete', 'success');
        } catch (err) {
            showToast('AI Analysis failed. Ensure profile is complete.', 'error');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleUpdateStage = async (userId, newStage) => {
        try {
            await api.put(`/api/auth/candidates/${userId}/stage`, { hiring_stage: newStage });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, hiring_stage: newStage } : u));
            if (selectedCandidate?.id === userId) {
                setCandidateDetail(prev => ({ ...prev, profile: { ...prev.profile, hiring_stage: newStage } }));
            }
            showToast(`Candidate moved to ${newStage.toUpperCase()}`, 'success');
        } catch (err) {
            showToast('Failed to update stage', 'error');
        }
    };

    const closeDrawer = () => {
        if (drawerRef.current) {
            gsap.to(drawerRef.current, { x: 60, opacity: 0, duration: 0.25, ease: 'power3.in', onComplete: () => { setSelectedCandidate(null); setCandidateDetail(null); } });
        } else {
            setSelectedCandidate(null);
            setCandidateDetail(null);
        }
    };

    const openCreate = () => {
        setEditInterview(null);
        const defaultTime = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
        setForm({ title: '', scheduled_time: defaultTime, status: 'scheduled' });
        setShowModal(true);
    };

    const openEdit = (interview) => {
        setEditInterview(interview);
        setForm({
            title: interview.title,
            scheduled_time: new Date(interview.scheduled_time).toISOString().slice(0, 16),
            status: interview.status,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.scheduled_time) {
            showToast('Title and scheduled time are required.', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editInterview) {
                await api.put(`/api/interviews/${editInterview.id || editInterview.interview_id}`, {
                    title: form.title,
                    scheduled_time: new Date(form.scheduled_time).toISOString(),
                    status: form.status,
                });
                showToast('Interview updated!', 'success');
            } else {
                await api.post('/api/interviews', {
                    title: form.title,
                    scheduled_time: new Date(form.scheduled_time).toISOString(),
                });
                showToast('Interview created!', 'success');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Save failed.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this interview and all its bookings?')) return;
        setDeleting(id);
        try {
            await api.delete(`/api/interviews/${id}`);
            showToast('Interview deleted.', 'success');
            fetchData();
        } catch (err) {
            showToast(err.response?.data?.message || 'Delete failed.', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (dt) => {
        if (!dt) return 'N/A';
        return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';

    const getProfileScore = (detail) => {
        if (!detail) return 0;
        const { profile, stats } = detail;
        let score = 0;
        if (profile) score += 20;
        if (profile?.linkedin_url) score += 10;
        if (profile?.github_url) score += 10;
        if (profile?.resume_url) score += 15;
        if (stats?.hasSkills) score += 20;
        if (stats?.hasExperience) score += 15;
        if (stats?.totalBookings > 0) score += 10;
        return score;
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#10b981';
        if (score >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner" />
                <p>Establishing secure connection...</p>
            </div>
        );
    }

    return (
        <div ref={containerRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: '8px' }}>Control Center</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Global management for the interview platform.</p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>+ New Interview</button>
            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {[
                    { label: 'Cloud Interviews', val: interviews.length, icon: '📋', color: '#6366f1', trend: '+12%' },
                    { label: 'Active Pipeline', val: bookings.length, icon: '⚡', color: '#10b981', trend: '+5' },
                    { label: 'Talent Pool', val: users.length, icon: '💎', color: '#f59e0b', trend: 'Global' },
                    { label: 'Live Sessions', val: interviews.filter(i => i.status === 'active').length, icon: '🔴', color: '#ef4444', trend: 'Realtime' }
                ].map((stat, idx) => (
                    <div key={idx} className="stat-card card" style={{ padding: '24px', position: 'relative', overflow: 'hidden', border: '2px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', background: 'white' }}>
                        <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', fontSize: '5rem', opacity: 0.04, transform: 'rotate(-10deg)', filter: 'grayscale(1)' }}>{stat.icon}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ color: stat.color, background: `${stat.color}15`, padding: '8px', borderRadius: '12px', fontSize: '1.2rem', boxShadow: `0 4px 12px ${stat.color}22` }}>{stat.icon}</div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '6px' }}>{stat.trend}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{stat.label}</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-1px' }}>{stat.val}</div>
                    </div>
                ))}
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', marginBottom: '48px' }}>
                <div className="card" style={{ padding: '32px', border: '2px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                        <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '4px' }}>📊 System Traffic</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Live monitoring of platform engagement</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--success)' }}>LIVE SYNC</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px', height: '220px', paddingBottom: '32px', borderBottom: '2px solid var(--border)' }}>
                        {[
                            { label: 'Interviews', val: interviews.length, color: '#6366f1', max: 20 },
                            { label: 'Bookings', val: bookings.length, color: '#10b981', max: 30 },
                            { label: 'Success', val: bookings.filter(b => b.interview_status === 'completed').length, color: '#f59e0b', max: 15 },
                            { label: 'Requests', val: users.length, color: '#ef4444', max: 40 }
                        ].map(bar => (
                            <div key={bar.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '100%',
                                    background: bar.color,
                                    height: `${Math.max((bar.val / bar.max) * 100, 5)}%`,
                                    borderRadius: '6px 6px 0 0',
                                    transition: 'height 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '0.8rem',
                                    fontWeight: 900,
                                    textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}>
                                    {bar.val}
                                </div>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{bar.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '32px', background: 'var(--text-primary)', color: 'white', border: '2px solid var(--text-primary)', boxShadow: '8px 8px 0 var(--border)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', background: 'var(--accent-primary)', opacity: 0.1, borderRadius: '50%' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '24px', letterSpacing: '1px' }}>⚡ COMMAND CENTER</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', justifyContent: 'flex-start', padding: '14px' }} onClick={openCreate}>🚀 New Launch Configuration</button>
                        <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', justifyContent: 'flex-start', padding: '14px' }} onClick={() => fetchData()}>🔄 Resync Global State</button>
                        <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white', justifyContent: 'flex-start', padding: '14px' }} onClick={() => setActiveTab('candidates')}>💎 Talent Repository</button>

                        <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
                                <span style={{ opacity: 0.6, fontWeight: 700 }}>ENGINE STATUS</span>
                                <span style={{ color: 'var(--success)', fontWeight: 900 }}>STABLE</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} style={{ flex: 1, height: '4px', background: i < 7 ? 'var(--success)' : 'rgba(255,255,255,0.1)', borderRadius: '2px' }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '12px', border: '2px solid var(--border)', width: 'fit-content' }}>
                {[
                    { id: 'interviews', label: 'Interviews', icon: '📝' },
                    { id: 'bookings', label: 'Live Bookings', icon: '⚡' },
                    { id: 'candidates', label: 'Candidates', icon: '👥' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--text-primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                            fontWeight: 800,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s ease',
                            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {tab.id === 'candidates' && (
                            <span style={{
                                marginLeft: '4px',
                                background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--border)',
                                borderRadius: '100px',
                                padding: '1px 8px',
                                fontSize: '0.7rem'
                            }}>
                                {users.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'interviews' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }} className="table-wrapper">
                    {interviews.map(i => (
                        <div key={i.id || i.interview_id} className="card" style={{ padding: '0', border: '2px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ padding: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: i.status === 'active' ? '#fee2e2' : i.status === 'completed' ? '#dcfce7' : 'var(--bg-secondary)',
                                        color: i.status === 'active' ? '#991b1b' : i.status === 'completed' ? '#166534' : 'var(--text-secondary)',
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        letterSpacing: '1px'
                                    }}>
                                        {i.status.toUpperCase()}
                                    </span>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => openEdit(i)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>✏️</button>
                                        <button onClick={() => handleDelete(i.id || i.interview_id)} style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: '6px', padding: '6px', cursor: 'pointer' }}>🗑️</button>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '16px', color: 'var(--text-primary)', lineHeight: 1.2 }}>{i.title}</h3>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: 'var(--text-secondary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>📅</span>
                                        <span style={{ fontWeight: 700 }}>{formatDate(i.scheduled_time)}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                                        <span style={{ fontWeight: 700 }}>Protocol: Standard Evaluation</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px 24px', background: 'var(--bg-secondary)', borderTop: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ display: 'flex', marginLeft: '5px' }}>
                                        {[1, 2, 3].map(n => (
                                            <div key={n} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'white', border: '2px solid var(--border)', marginLeft: n > 0 ? '-10px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 900 }}>
                                                👤
                                            </div>
                                        ))}
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{i.booking_count || 0} Registered</span>
                                </div>
                                <button className="btn btn-primary btn-sm" onClick={() => openEdit(i)}>Control Panel</button>
                            </div>
                        </div>
                    ))}
                    <div
                        onClick={openCreate}
                        className="card"
                        style={{ border: '3px dashed var(--border)', background: 'transparent', boxShadow: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: '300px', transition: 'all 0.2s ease' }}
                    >
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginBottom: '14px' }}>+</div>
                        <div style={{ fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1px' }}>INITIALIZE NEW ROUND</div>
                    </div>
                </div>
            )}

            {
                activeTab === 'bookings' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="table-wrapper">
                        <div style={{ padding: '0 20px 10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '1px' }}>
                            <span>LATEST ACTIVITY</span>
                            <span>STATUS REPORT</span>
                        </div>
                        {bookings.map((b, idx) => (
                            <div key={b.booking_id} className="card" style={{ padding: '16px 28px', border: '2px solid var(--border)', boxShadow: '4px 4px 0 var(--border)', display: 'flex', alignItems: 'center', gap: '24px', transition: 'all 0.2s ease', position: 'relative' }}>
                                <div style={{ width: '54px', height: '54px', borderRadius: '14px', background: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.1rem', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                    {getInitials(b.candidate_name)}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 900, fontSize: '1.1rem' }}>{b.candidate_name}</span>
                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--bg-secondary)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)' }}>ID: {b.booking_id ? String(b.booking_id).slice(-6).toUpperCase() : 'N/A'}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem' }}>
                                        <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>🎯 {b.interview_title}</span>
                                        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>🗓️ {formatDate(b.scheduled_time)}</span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                    <span className={`badge badge-${b.interview_status}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 900, marginBottom: '4px', display: 'inline-block' }}>
                                        {b.interview_status}
                                    </span>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                        Booked {new Date(b.booked_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <button
                                    className="btn btn-secondary btn-sm"
                                    style={{ borderRadius: '8px', padding: '10px 16px' }}
                                    onClick={() => {
                                        const user = users.find(u => u.id === b.user_id);
                                        if (user) openCandidateDetail(user);
                                        setActiveTab('candidates');
                                    }}
                                >
                                    Analysis
                                </button>
                            </div>
                        ))}
                        {bookings.length === 0 && (
                            <div className="card" style={{ textAlign: 'center', padding: '80px', border: '2px dashed var(--border)', background: 'transparent' }}>
                                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🏜️</div>
                                <h3 style={{ fontWeight: 900, fontSize: '1.5rem', marginBottom: '10px' }}>No active bookings detected</h3>
                                <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>The platform is currently idle. Activity will appear here in real-time.</p>
                            </div>
                        )}
                    </div>
                )}

            {
                activeTab === 'candidates' && (
                    <div style={{ display: 'grid', gridTemplateColumns: selectedCandidate ? '1fr 400px' : '1fr', gap: '24px', transition: 'grid-template-columns 0.3s ease' }}>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'list' ? 'white' : 'transparent', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: viewMode === 'list' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                    >
                                        � LIST VIEW
                                    </button>
                                    <button
                                        onClick={() => setViewMode('kanban')}
                                        style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: viewMode === 'kanban' ? 'white' : 'transparent', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', boxShadow: viewMode === 'kanban' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none', color: viewMode === 'kanban' ? 'var(--text-primary)' : 'var(--text-muted)' }}
                                    >
                                        📋 KANBAN BOARD
                                    </button>
                                </div>

                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, marginLeft: '24px', maxWidth: '400px' }}>
                                    <input
                                        className="form-input"
                                        style={{ flex: 1, padding: '10px 16px', border: '2px solid var(--border)' }}
                                        placeholder="🔍 Search candidates..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            {viewMode === 'list' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                    {filteredUsers.map(u => {
                                        const userBookings = bookings.filter(b => b.user_id === u.id);
                                        const isSelected = selectedCandidate?.id === u.id;
                                        return (
                                            <div
                                                key={u.id}
                                                onClick={() => openCandidateDetail(u)}
                                                className="card"
                                                style={{
                                                    padding: '20px',
                                                    cursor: 'pointer',
                                                    border: isSelected ? '2px solid var(--accent-primary)' : '2px solid var(--border)',
                                                    boxShadow: isSelected ? '4px 4px 0 var(--accent-primary)' : '4px 4px 0 var(--border)',
                                                    transition: 'all 0.2s ease',
                                                    transform: isSelected ? 'translate(-2px,-2px)' : 'none',
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                                                    <div style={{
                                                        width: '46px', height: '46px', borderRadius: '50%',
                                                        background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-blue))',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: 'white', fontWeight: 900, fontSize: '1rem',
                                                        border: '2px solid var(--border)', flexShrink: 0,
                                                    }}>
                                                        {getInitials(u.name)}
                                                    </div>
                                                    <div style={{ minWidth: 0 }}>
                                                        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.hiring_stage?.toUpperCase() || 'SCREENING'}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--bg-secondary)', padding: '3px 8px', borderRadius: '4px' }}>
                                                        📅 {new Date(u.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, background: userBookings.length > 0 ? '#dcfce7' : '#fef3c7', color: userBookings.length > 0 ? '#166534' : '#92400e', padding: '3px 8px', borderRadius: '4px' }}>
                                                        {userBookings.length > 0 ? `✅ ${userBookings.length} Booked` : '⏳ No bookings'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
                                    {['screening', 'technical', 'hr', 'offered', 'rejected'].map(stage => {
                                        const stageUsers = filteredUsers.filter(u => (u.hiring_stage || 'screening') === stage);
                                        return (
                                            <div key={stage} style={{ minWidth: '240px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '0 4px' }}>
                                                    <span style={{ fontWeight: 900, fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '1px' }}>{stage.toUpperCase()}</span>
                                                    <span style={{ background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900 }}>{stageUsers.length}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    {stageUsers.map(u => (
                                                        <div
                                                            key={u.id}
                                                            onClick={(e) => { e.stopPropagation(); openCandidateDetail(u); }}
                                                            className="card"
                                                            style={{ padding: '16px', cursor: 'pointer', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                                                        >
                                                            <div style={{ fontWeight: 800, marginBottom: '8px' }}>{u.name}</div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>{u.email.split('@')[0]}</span>
                                                                <select
                                                                    value={stage}
                                                                    onClick={e => e.stopPropagation()}
                                                                    onChange={e => handleUpdateStage(u.id, e.target.value)}
                                                                    style={{ fontSize: '0.6rem', padding: '2px', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 800 }}
                                                                >
                                                                    <option value="screening">SCR</option>
                                                                    <option value="technical">TEC</option>
                                                                    <option value="hr">HR</option>
                                                                    <option value="offered">OFF</option>
                                                                    <option value="rejected">REJ</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {filteredUsers.length === 0 && (
                                <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                                    <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No candidates found</h3>
                                    <p style={{ color: 'var(--text-muted)' }}>Try a different search term.</p>
                                </div>
                            )}
                        </div>

                        {selectedCandidate && (
                            <div ref={drawerRef} className="card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content', position: 'sticky', top: '100px', border: '2px solid var(--border)', boxShadow: '8px 8px 0 var(--border)' }}>

                                <div style={{ padding: '20px 24px', background: 'var(--text-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '1.1rem', border: '3px solid rgba(255,255,255,0.3)', flexShrink: 0 }}>
                                            {getInitials(selectedCandidate.name)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>{selectedCandidate.name}</div>
                                            <div style={{ fontSize: '0.78rem', opacity: 0.7 }}>{selectedCandidate.email}</div>
                                        </div>
                                    </div>
                                    <button onClick={closeDrawer} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '1rem', fontWeight: 900 }}>✕</button>
                                </div>

                                {candidateLoading ? (
                                    <div style={{ padding: '60px', textAlign: 'center' }}>
                                        <div className="spinner" style={{ margin: '0 auto 16px' }} />
                                        <p style={{ color: 'var(--text-muted)' }}>Loading profile...</p>
                                    </div>
                                ) : candidateDetail ? (
                                    <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>

                                        <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--border)' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>📊 ANALYSIS REPORT</div>

                                            {(() => {
                                                const score = getProfileScore(candidateDetail);
                                                const color = getScoreColor(score);
                                                return (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                                        <div style={{ position: 'relative', width: '60px', height: '60px' }}>
                                                            <svg width="60" height="60" viewBox="0 0 36 36">
                                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                                                <circle cx="18" cy="18" r="15.9" fill="none" stroke={color} strokeWidth="3"
                                                                    strokeDasharray={`${score} ${100 - score}`} strokeLinecap="round" />
                                                            </svg>
                                                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, color }}>
                                                                {score}%
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 900, fontSize: '1rem', color }}>
                                                                {score >= 80 ? '🌟 Strong Profile' : score >= 50 ? '⚡ Good Potential' : '🔧 Needs Work'}
                                                            </div>
                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                                Profile completeness score
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '16px' }}>
                                                {[
                                                    { label: 'Total Bookings', val: candidateDetail.stats.totalBookings, icon: '📋', color: '#3b82f6' },
                                                    { label: 'Completed', val: candidateDetail.stats.completedInterviews, icon: '✅', color: '#10b981' },
                                                    { label: 'Upcoming', val: candidateDetail.stats.upcomingInterviews, icon: '⏰', color: '#f59e0b' },
                                                    { label: 'Profile', val: candidateDetail.stats.profileComplete ? 'Set' : 'Empty', icon: '👤', color: candidateDetail.stats.profileComplete ? '#10b981' : '#ef4444' },
                                                ].map(s => (
                                                    <div key={s.label} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center' }}>
                                                        <div style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{s.icon}</div>
                                                        <div style={{ fontWeight: 900, fontSize: '1.1rem', color: s.color }}>{s.val}</div>
                                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div style={{ marginTop: '20px' }}>
                                                {!analysisResult ? (
                                                    <button
                                                        className="btn btn-primary btn-full"
                                                        style={{ background: 'var(--text-primary)', border: 'none', padding: '12px' }}
                                                        onClick={handleGenerateAIAnalysis}
                                                        disabled={analyzing}
                                                    >
                                                        {analyzing ? '⚙️ GENERATING INSIGHTS...' : '✨ GENERATE AI STRATEGIC INSIGHT'}
                                                    </button>
                                                ) : (
                                                    <div className="card" style={{ background: '#f8fafc', border: '2px solid #e2e8f0', padding: '16px' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>🚀 STRATEGIC PROFILE ANALYSIS</span>
                                                            <span style={{ color: '#10b981' }}>{analysisResult.readinessScore}% READY</span>
                                                        </div>
                                                        <div style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, marginBottom: '12px', fontWeight: 600 }}>
                                                            {analysisResult.marketAnalysis}
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <div style={{ fontWeight: 800, fontSize: '0.7rem', color: 'var(--text-muted)' }}>SUGGESTED ROLES:</div>
                                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                                {analysisResult.suggestedRoles?.map(role => (
                                                                    <span key={role} style={{ background: 'white', border: '1px solid #cbd5e1', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>{role}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <button
                                                            className="btn btn-secondary btn-sm"
                                                            style={{ marginTop: '12px', width: '100%', fontSize: '0.65rem' }}
                                                            onClick={() => setAnalysisResult(null)}
                                                        >
                                                            REFRESH ANALYSIS
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {candidateDetail.profile && (
                                            <>
                                                <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--border)' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>👤 PERSONAL INFO</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {[
                                                            { label: 'Location', val: candidateDetail.profile.location },
                                                            { label: 'Degree', val: `${candidateDetail.profile.degree} in ${candidateDetail.profile.specialization}` },
                                                            { label: 'University', val: candidateDetail.profile.university },
                                                            { label: 'Hiring Stage', val: candidateDetail.profile.hiring_stage?.toUpperCase() || 'SCREENING' },
                                                        ].map(item => (
                                                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{item.label}</span>
                                                                <span style={{ fontWeight: 800 }}>{item.val || 'N/A'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {candidateDetail.stats.hasSkills && (
                                                    <div style={{ padding: '20px 24px', borderBottom: '2px solid var(--border)' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>🛠️ TECHNICAL SKILLS</div>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                            {Object.entries(candidateDetail.profile.skills || {}).map(([category, list]) => (
                                                                Array.isArray(list) && list.map(skill => (
                                                                    <span key={skill} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800 }}>{skill}</span>
                                                                ))
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {candidateDetail.bookings.length > 0 && (
                                            <div style={{ padding: '20px 24px' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>📅 INTERVIEW HISTORY</div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {candidateDetail.bookings.map(b => (
                                                        <div key={b.booking_id} style={{ marginBottom: '12px' }}>
                                                            <div style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div>
                                                                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{b.interview_title}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{formatDate(b.scheduled_time)}</div>
                                                                </div>
                                                                <span className={`badge badge-${b.interview_status}`} style={{ fontSize: '0.65rem', border: '1px solid var(--border)' }}>{b.interview_status.toUpperCase()}</span>
                                                            </div>
                                                            {b.interview_report && (
                                                                <div style={{ marginTop: '4px', padding: '16px', background: 'white', border: '2px solid var(--border)', borderTop: 'none', borderRadius: '0 0 12px 12px', position: 'relative', top: '-6px' }}>
                                                                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--success)', marginBottom: '8px' }}>📋 FINAL ASSESSMENT SUMMARY</div>
                                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '4px' }}>
                                                                        "{b.interview_report.summary}"
                                                                    </div>
                                                                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                                        <span>By: {b.interview_report.completed_by}</span>
                                                                        <span>{new Date(b.interview_report.completed_at).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <details style={{ marginTop: '12px' }}>
                                                                        <summary style={{ fontSize: '0.75rem', fontWeight: 900, cursor: 'pointer', color: 'var(--accent-blue)', outline: 'none' }}>📜 View Session Transcript</summary>
                                                                        <div style={{ marginTop: '8px', padding: '10px', background: '#f1f5f9', borderRadius: '4px', maxHeight: '150px', overflowY: 'auto', fontSize: '0.75rem', color: '#475569', whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                                                                            {b.interview_report.transcript || 'No transcript available.'}
                                                                        </div>
                                                                    </details>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        )}
                    </div>
                )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal card">
                        <div className="modal-header">
                            <h2 className="modal-title">{editInterview ? 'Update Session' : 'Create Session'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSave}>
                            <div className="form-group">
                                <label className="form-label">Title</label>
                                <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Schedule</label>
                                <input className="form-input" type="datetime-local" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} required />
                            </div>
                            {editInterview && (
                                <div className="form-group">
                                    <label className="form-label">Status</label>
                                    <select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary btn-full" disabled={saving}>{saving ? 'Saving...' : 'Save Session'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
