import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getSocket } from '../services/socket';
import api from '../services/api';
import { gsap } from 'gsap';

const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:openrelay.metered.ca:80' },
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:80?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

const InterviewRoom = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [interview, setInterview] = useState(null);
    const [joined, setJoined] = useState(false);
    const [participants, setParticipants] = useState(0);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [mediaReady, setMediaReady] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
    const [peerConnected, setPeerConnected] = useState(false);
    const [remoteUser, setRemoteUser] = useState(null);
    const [callStatus, setCallStatus] = useState('idle');

    const [executing, setExecuting] = useState(false);
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [currentPhase, setCurrentPhase] = useState(2);
    const [progress, setProgress] = useState(45);
    const [showReportModal, setShowReportModal] = useState(false);
    const [interviewerNotes, setInterviewerNotes] = useState('');
    const [completing, setCompleting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const recognitionRef = useRef(null);

    const PHASES = [
        { id: 0, label: 'INTRO', desc: 'Briefing' },
        { id: 1, label: 'SYSTEM', desc: 'Architecture' },
        { id: 2, label: 'CODING', desc: 'Implementation' },
        { id: 3, label: 'Q&A', desc: 'Discussion' },
        { id: 4, label: 'WRAP', desc: 'Conclusion' }
    ];

    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const isInitiatorRef = useRef(false);

    const socket = getSocket();
    const { showToast } = useToast();

    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };

    const startMedia = useCallback(async () => {
        console.log('🎬 Initializing media devices...');
        setMediaError(null);

        try {
            const constraints = {
                video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
                audio: true,
            };

            let stream;
            try {
                console.log('📡 Trying optimal constraints...');
                stream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (err) {
                console.warn('⚠️ Optimal constraints failed, trying basic Video + Audio...');
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                } catch (err2) {
                    console.warn('⚠️ Basic Video+Audio failed, trying Video only...');
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true });
                    } catch (err3) {
                        console.warn('⚠️ Video failed, trying Audio only...');
                        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    }
                }
            }

            localStreamRef.current = stream;
            const hasVideo = stream.getVideoTracks().length > 0;
            const hasAudio = stream.getAudioTracks().length > 0;

            if (localVideoRef.current && hasVideo) {
                localVideoRef.current.srcObject = stream;
                setTimeout(async () => {
                    if (localVideoRef.current) {
                        try {
                            await localVideoRef.current.play();
                        } catch (e) {
                            console.error('Video play error:', e);
                        }
                    }
                }, 150);
            }

            setMediaReady(true);
            setCamOn(hasVideo);
            setMicOn(hasAudio);

            if (!hasVideo || !hasAudio) {
                const missing = !hasVideo && !hasAudio ? 'Camera and Mic' : (!hasVideo ? 'Camera' : 'Microphone');
                showToast(`Partial media: ${missing} not found.`, 'warning');
            } else {
                showToast('Camera & microphone connected ✅', 'success');
            }

            console.log(`✅ Media active. Video: ${hasVideo}, Audio: ${hasAudio}`);
        } catch (err) {
            console.error('❌ Media initialization completely failed:', err);
            let msg = 'Media access totally failed.';
            if (err.name === 'NotFoundError') msg = 'No camera or microphone hardware detected.';
            if (err.name === 'NotAllowedError') msg = 'Permission denied — check your browser settings.';
            if (err.name === 'NotReadableError') msg = 'Device is already in use by another application.';

            setMediaError(msg);
            showToast(msg, 'error');
        }
    }, [showToast]);

    const stopMedia = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) localVideoRef.current.srcObject = null;
        setMediaReady(false);
    }, []);

    const closePeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setPeerConnected(false);
        setCallStatus('idle');
        setRemoteUser(null);
        isInitiatorRef.current = false;
    }, []);

    const createPeerConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
        }

        const pc = new RTCPeerConnection(ICE_CONFIG);
        peerConnectionRef.current = pc;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current);
            });
        }

        pc.ontrack = (event) => {
            if (remoteVideoRef.current && event.streams[0]) {
                remoteVideoRef.current.srcObject = event.streams[0];
                setPeerConnected(true);
                setCallStatus('connected');
                showToast('📹 Video call connected!', 'success');
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
                socket.emit('webrtc:ice-candidate', {
                    interview_id: parseInt(id),
                    candidate: event.candidate,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setPeerConnected(false);
                setCallStatus('idle');
                showToast('Video call ended', 'info');
            }
        };

        pc.oniceconnectionstatechange = () => {
            if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
                setPeerConnected(true);
                setCallStatus('connected');
            }
        };

        return pc;
    }, [id, socket, showToast]);

    const startCall = useCallback(async () => {
        if (!socket || !localStreamRef.current) return;
        setCallStatus('calling');
        isInitiatorRef.current = true;

        const pc = createPeerConnection();

        try {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:offer', { interview_id: parseInt(id), offer });
        } catch (err) {
            console.error('WebRTC offer error:', err);
            showToast('Failed to start video call', 'error');
            setCallStatus('idle');
        }
    }, [socket, id, createPeerConnection, showToast]);

    useEffect(() => {
        const fetchInterview = async () => {
            try {
                const res = await api.get(`/api/interviews/${id}`);
                const interviewData = res.data.interview;
                setInterview(interviewData);
                const roleLabel = user.role === 'admin' ? 'Interviewer' : 'Candidate';
                setCode(`function main() {\n    console.log("Ready...");\n}\n`);
            } catch {
                navigate('/interviews');
            } finally {
                setLoading(false);
            }
        };
        fetchInterview();
    }, [id, navigate, user.name]);

    useEffect(() => {
        if (!loading) {
            // Wait for the render to complete before starting media and animations
            setTimeout(() => {
                startMedia();
                if (document.querySelector('.step-animate')) {
                    gsap.from('.step-animate', { y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out' });
                }
            }, 100);
        }
        return () => {
            stopMedia();
            closePeerConnection();
        };
    }, [loading, startMedia, stopMedia, closePeerConnection]);

    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(() => { });
        }
    }, [mediaReady, camOn]);

    useEffect(() => {
        if (remoteVideoRef.current && peerConnected) {
        }
    }, [peerConnected]);

    useEffect(() => {
        if (!socket) return;

        setSocketConnected(socket.connected);
        socket.on('connect', () => setSocketConnected(true));
        socket.on('disconnect', () => {
            setSocketConnected(false);
            setJoined(false);
            closePeerConnection();
        });

        socket.on('room:status', (data) => {
            if (data.interview_id === parseInt(id)) {
                setParticipants(data.participants || 0);
                if (data.message) {
                    setMessages(prev => [...prev, { type: 'system', text: data.message, timestamp: data.timestamp }]);
                }
                if (data.participants >= 2 && data.joinedUser && data.joinedUser.id !== user.id) {
                    setRemoteUser(data.joinedUser);
                    showToast(`${data.joinedUser.name} joined the room`, 'info');
                }
            }
        });

        socket.on('room:message', (data) => {
            setMessages(prev => [...prev, {
                type: 'chat', user: data.user, text: data.message,
                timestamp: data.timestamp, own: data.user.id === user.id,
            }]);
        });

        socket.on('room:code_update', (data) => setCode(data.code));
        socket.on('room:exec_update', (data) => {
            setConsoleOutput(data.output);
            setExecuting(data.executing);
        });
        socket.on('room:transcript_update', (data) => {
            setTranscript(prev => [...prev.slice(-10), { text: data.text, user: data.user, timestamp: new Date() }]);
        });
        socket.on('room:error', (err) => console.error('Room error:', err.message));

        socket.on('webrtc:ready', async (data) => {
            setRemoteUser(data.user);
            showToast(`${data.user?.name || 'Other user'} is ready — starting video call...`, 'info');
            setCallStatus('calling');
            await startCall();
        });

        socket.on('webrtc:offer', async ({ offer }) => {
            setCallStatus('answering');
            const pc = createPeerConnection();
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('webrtc:answer', { interview_id: parseInt(id), answer });
            } catch (err) {
                console.error('WebRTC answer error:', err);
                showToast('Failed to answer video call', 'error');
                setCallStatus('idle');
            }
        });

        socket.on('webrtc:answer', async ({ answer }) => {
            if (peerConnectionRef.current) {
                try {
                    await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error('WebRTC setRemoteDescription error:', err);
                }
            }
        });

        socket.on('webrtc:ice-candidate', async ({ candidate }) => {
            if (peerConnectionRef.current && candidate) {
                try {
                    await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error('ICE candidate error:', err);
                }
            }
        });

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('room:status');
            socket.off('room:message');
            socket.off('room:code_update');
            socket.off('room:error');
            socket.off('webrtc:ready');
            socket.off('webrtc:offer');
            socket.off('webrtc:answer');
            socket.off('webrtc:ice-candidate');
        };
    }, [socket, id, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleJoin = () => {
        if (!socket || !socketConnected) {
            showToast('Socket not connected. Please wait or refresh.', 'error');
            return;
        }
        socket.emit('room:join', { interview_id: parseInt(id) });
        setJoined(true);
        setMessages(prev => [...prev, { type: 'system', text: '🎯 Connection established — you are live', timestamp: new Date().toISOString() }]);

        setTimeout(() => {
            if (socket && localStreamRef.current) {
                socket.emit('webrtc:ready', { interview_id: parseInt(id) });
            }
        }, 800);
    };

    const handleLeave = () => {
        if (!socket) return;
        socket.emit('room:leave', { interview_id: parseInt(id) });
        setJoined(false);
        closePeerConnection();
        setMessages(prev => [...prev, { type: 'system', text: '🔒 Disconnected from room', timestamp: new Date().toISOString() }]);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        if (!joined) {
            showToast('Click "INITIALIZE ROOM" first to join the session.', 'warning');
            return;
        }
        if (!socket || !socketConnected) {
            showToast('Socket disconnected. Please refresh the page.', 'error');
            return;
        }
        socket.emit('room:message', { interview_id: parseInt(id), message: messageInput.trim() });
        setMessageInput('');
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        if (socket && joined) {
            socket.emit('room:code_sync', { interview_id: parseInt(id), code: newCode });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;
            const newCode = code.substring(0, start) + '    ' + code.substring(end);
            setCode(newCode);
            setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 4; }, 0);
        }
    };

    const handleClearWorkspace = () => {
        if (window.confirm('Clear the entire workspace?')) {
            handleCodeChange('// Workspace cleared\n');
            setConsoleOutput('');
            showToast('Workspace cleared', 'info');
        }
    };

    const handleExecuteCode = async () => {
        if (!code.trim()) return;
        setExecuting(true);
        setConsoleOutput('> Initializing execution engine...\n');

        try {
            const res = await api.post('/api/code/execute', {
                code,
                language: 'javascript'
            });

            if (res.data.success) {
                const output = `> Execution Success:\n${res.data.output}`;
                setConsoleOutput(output);
                if (socket && joined) {
                    socket.emit('room:exec_sync', { interview_id: parseInt(id), output, executing: false });
                }
                showToast('Code executed successfully', 'success');
            } else {
                const output = `> Execution Failed:\n${res.data.output}`;
                setConsoleOutput(output);
                if (socket && joined) {
                    socket.emit('room:exec_sync', { interview_id: parseInt(id), output, executing: false });
                }
                showToast('Execution error', 'error');
            }
        } catch (err) {
            setConsoleOutput(`> Engine Error: ${err.response?.data?.message || err.message}`);
            showToast('Failed to communicate with execution engine', 'error');
        } finally {
            setExecuting(false);
        }
    };

    const toggleTranscription = () => {
        if (isTranscribing) {
            recognitionRef.current?.stop();
            setIsTranscribing(false);
            showToast('Transcription stopped', 'info');
        } else {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                showToast('Speech Recognition not supported in this browser.', 'error');
                return;
            }

            const recog = new SpeechRecognition();
            recog.continuous = true;
            recog.interimResults = false;
            recog.lang = 'en-US';

            recog.onresult = (event) => {
                const text = event.results[event.results.length - 1][0].transcript;
                const entry = { text, user: { name: user.name, role: user.role }, timestamp: new Date() };
                setTranscript(prev => [...prev.slice(-10), entry]);
                if (socket && joined) {
                    socket.emit('room:transcript_sync', { interview_id: parseInt(id), text: text, user: { name: user.name, role: user.role } });
                }
            };

            recog.onerror = (err) => {
                console.error('Speech error:', err);
                setIsTranscribing(false);
            };

            recog.onend = () => {
                if (isTranscribing) recog.start();
            };

            recog.start();
            recognitionRef.current = recog;
            setIsTranscribing(true);
            showToast('Live Intelligence active 🎙️', 'success');
        }
    };

    const toggleMic = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        }
        setMicOn(prev => !prev);
        showToast(micOn ? 'Microphone muted 🔇' : 'Microphone on 🎙️', 'info');
    };

    const toggleCam = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        }
        setCamOn(prev => !prev);
        showToast(camOn ? 'Camera off 📷' : 'Camera on 📹', 'info');
    };

    const handleCompleteInterview = async (e) => {
        e.preventDefault();
        if (!interviewerNotes.trim()) {
            showToast('Please provide an interview summary.', 'warning');
            return;
        }

        setCompleting(true);
        try {
            await api.put(`/api/interviews/${id}`, {
                status: 'completed',
                report: {
                    summary: interviewerNotes,
                    completed_at: new Date().toISOString(),
                    completed_by: user.name,
                    transcript: transcript.map(t => `${t.user.name}: ${t.text}`).join('\n')
                }
            });
            setShowReportModal(false);
            setShowSuccess(true);
            stopMedia();
        } catch (err) {
            console.error('Submit error:', err);
            showToast('Failed to complete interview. Check if you have permission.', 'error');
        } finally {
            setCompleting(false);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
    if (!interview) return null;

    const callStatusLabel = {
        idle: peerConnected ? 'Connected' : 'Waiting for other participant...',
        calling: 'Connecting video call...',
        answering: 'Answering call...',
        connected: `Live with ${remoteUser?.name || 'participant'}`,
    }[callStatus] || '';

    return (
        <div ref={containerRef} className="room-container" style={{
            padding: '40px 5% 32px',
            maxWidth: '100%',
            margin: '0',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-primary)',
            overflowX: 'hidden',
            overflowY: 'auto',
            boxSizing: 'border-box',
            position: 'relative',
            zIndex: 1
        }}>

            <div className="bg-grid-overlay" style={{ opacity: 0.1 }} />


            <header className="page-header" style={{
                marginBottom: '48px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                flexShrink: 0,
                position: 'relative',
                zIndex: 10
            }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => { handleLeave(); stopMedia(); navigate('/interviews'); }} style={{ borderRadius: '100px', textTransform: 'none', padding: '6px 20px', fontSize: '0.8rem' }}>
                            ← Exit System
                        </button>
                        <button className="btn btn-primary btn-sm" onClick={() => setShowReportModal(true)} style={{ borderRadius: '100px', textTransform: 'none', padding: '6px 20px', fontSize: '0.8rem', background: 'var(--success)' }}>
                            ✓ Complete & Report
                        </button>
                        <h1 className="step-animate" style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-2px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {interview.title}
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, padding: '4px 12px', background: 'var(--accent-gradient)', borderRadius: '100px', color: 'white', letterSpacing: '1px' }}>LIVE_NODE</span>
                        </h1>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                        <div className="card" style={{ padding: '10px 24px', boxShadow: '8px 8px 0 var(--border)', background: 'white', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Progress</div>
                                <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem', lineHeight: 1 }}>{progress}%</div>
                            </div>
                            <div style={{ width: '120px', height: '8px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-blue)', transition: 'width 1s ease' }} />
                            </div>
                        </div>

                        {!joined ? (
                            <button className="btn btn-primary" onClick={handleJoin} style={{ padding: '20px 48px', fontSize: '1.1rem', boxShadow: '8px 8px 0 var(--border)' }}>
                                Join Room Now
                            </button>
                        ) : (
                            <div style={{ background: 'var(--success)', color: 'white', padding: '16px 32px', borderRadius: 'var(--radius-md)', border: '2px solid var(--border)', boxShadow: '8px 8px 0 var(--border)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                ● Connected
                            </div>
                        )}
                    </div>
                </div>


                <div style={{ paddingLeft: '4px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="pulse" style={{ width: '10px', height: '10px', background: joined ? 'var(--success)' : 'var(--danger)', borderRadius: '50%', boxShadow: joined ? '0 0 12px var(--success)' : 'none' }} />
                        {joined ? 'Secure Uplink Established. High-fidelity audio telemetry active.' : 'System standby. Awaiting participant uplink...'}
                    </div>
                </div>
            </header>

            <div className="room-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 450px', gap: '32px', flex: 1, minHeight: 0, position: 'relative', zIndex: 10 }}>
                <div className="workspace-area" style={{ display: 'flex', flexDirection: 'column', gap: '32px', minHeight: 0, flex: 1 }}>

                    <div className="card" style={{ flex: 1, minHeight: '450px', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', background: '#1e1e2e', boxShadow: '8px 8px 0 var(--border)' }}>
                        <div style={{ height: '72px', padding: '0 24px', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center' }}>Code Environment</h2>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button className="btn btn-outline btn-sm" onClick={handleClearWorkspace}>Clear</button>
                                <button className="btn btn-primary btn-sm" onClick={handleExecuteCode} disabled={executing}>
                                    {executing ? 'Executing...' : 'Run Code'}
                                </button>
                            </div>
                        </div>
                        <div style={{ flex: 1, padding: '0 12px 0 0', background: '#1e1e2e', display: 'flex', minHeight: 0 }}>
                            <div style={{ width: '50px', padding: '20px 0', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem', fontFamily: '"JetBrains Mono", monospace', userSelect: 'none' }}>
                                {code.split('\n').map((_, i) => <div key={i} style={{ height: '1.6rem', lineHeight: '1.6rem' }}>{i + 1}</div>)}
                            </div>
                            <textarea
                                className="code-editor"
                                value={code}
                                onChange={e => handleCodeChange(e.target.value)}
                                onKeyDown={handleKeyDown}
                                style={{ flex: 1, background: 'transparent', color: '#cdd6f4', border: 'none', padding: '20px 12px 20px 24px', fontFamily: '"JetBrains Mono", monospace', fontSize: '1.05rem', lineHeight: '1.6rem', resize: 'none', outline: 'none' }}
                                spellCheck="false"
                            />
                        </div>
                    </div>


                    <div className="card" style={{ height: '30vh', minHeight: '220px', background: '#0f0f1a', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, boxShadow: '8px 8px 0 var(--border)' }}>
                        <div style={{ height: '72px', padding: '0 24px', borderBottom: '2px solid var(--border)', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>System Terminal</h2>
                            <button className="btn-text" onClick={() => setConsoleOutput('')} style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Purge_Logs</button>
                        </div>
                        <div style={{ flex: 1, padding: '16px 24px', color: '#8b8ba7', fontFamily: '"JetBrains Mono", monospace', fontSize: '0.95rem', overflowY: 'auto', paddingRight: '12px' }}>
                            {consoleOutput || <span style={{ opacity: 0.2 }}>&gt; Waiting for execution instructions...</span>}
                        </div>
                    </div>
                </div>

                <aside className="side-panel" style={{ display: 'flex', flexDirection: 'column', gap: '32px', height: '100%', minHeight: 0 }}>

                    <div className="card" style={{ padding: '24px', flexShrink: 0, boxShadow: '8px 8px 0 var(--border)', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', width: '100%' }}>
                            <div style={{ background: 'var(--text-primary)', borderRadius: 'var(--radius-md)', aspectRatio: '1.2/1', overflow: 'hidden', position: 'relative', border: '2px solid var(--border)' }}>
                                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--accent-blue)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900, color: 'white', zIndex: 5, border: '1px solid var(--border)', letterSpacing: '1px' }}>YOU</div>
                                <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
                                {(!mediaReady || !camOn) && <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '1rem', textAlign: 'center', padding: '10px' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{!camOn ? '🚫' : '⌛'}</div>
                                    {mediaError ? <div style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700, marginBottom: '12px' }}>{mediaError}</div> : <div style={{ marginBottom: '12px' }}>Initializing Camera...</div>}
                                    <button onClick={startMedia} style={{ padding: '4px 12px', background: 'var(--accent-blue)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 900, cursor: 'pointer' }}>
                                        RETRY ACCESS
                                    </button>
                                </div>}
                            </div>
                            <div style={{ background: 'var(--text-primary)', borderRadius: 'var(--radius-md)', aspectRatio: '1.2/1', overflow: 'hidden', position: 'relative', border: '2px solid var(--border)' }}>
                                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'var(--text-primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.6rem', fontWeight: 900, color: 'white', zIndex: 5, border: '1px solid white', letterSpacing: '1px' }}>REMOTE</div>
                                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                {!peerConnected && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--text-muted)', fontSize: '2rem' }}>⌛</div>}
                            </div>
                        </div>


                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={toggleCam} className={`btn btn-sm ${camOn ? 'btn-primary' : 'btn-outline'}`} style={{ borderRadius: '8px', padding: '10px 16px', textTransform: 'none', fontSize: '0.8rem' }}>
                                {camOn ? '📹 Camera On' : '🚫 Camera Off'}
                            </button>
                            <button onClick={toggleMic} className={`btn btn-sm ${micOn ? 'btn-primary' : 'btn-outline'}`} style={{ borderRadius: '8px', padding: '10px 16px', textTransform: 'none', fontSize: '0.8rem' }}>
                                {micOn ? '🎙️ Mic On' : '🔇 Muted'}
                            </button>
                        </div>
                    </div>


                    <div className="card" style={{ flex: '1 0 400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', boxShadow: '8px 8px 0 var(--border)' }}>
                        <div style={{ height: '72px', padding: '0 24px', borderBottom: '2px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Signals & Comms</h2>
                            <div style={{ padding: '6px 14px', background: 'var(--accent-blue)', color: 'white', borderRadius: '100px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '1px' }}>UPLINK_STABLE</div>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 24px 8px', display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0, background: 'var(--bg-glass)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
                                Secure Channel Established. Monitoring high-fidelity audio telemetry...
                            </div>

                            {messages.map((msg, i) => (
                                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.own ? 'flex-end' : 'flex-start' }}>
                                    <div style={{
                                        background: msg.own ? 'var(--accent-blue)' : 'white',
                                        color: msg.own ? 'white' : 'var(--text-primary)',
                                        padding: '14px 20px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--border)',
                                        boxShadow: '8px 8px 0 var(--border)',
                                        fontSize: '0.9rem',
                                        fontWeight: 600,
                                        maxWidth: '85%'
                                    }}>{msg.text}</div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} style={{ padding: '16px 24px 24px', background: 'white', borderTop: '2px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <input className="form-input" style={{ flex: 1, border: '2px solid var(--border)', padding: '16px 20px', fontSize: '1rem', height: '64px' }} placeholder="Inject mission comms..." value={messageInput} onChange={e => setMessageInput(e.target.value)} />
                            <button type="submit" className="btn btn-primary" style={{ height: '64px', padding: '0 32px', textTransform: 'uppercase', letterSpacing: '1px', flexShrink: 0, boxShadow: '4px 4px 0 var(--border)' }}>Send</button>
                        </form>
                    </div>
                </aside>
            </div>

            {showReportModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }}>
                    <div className="card" style={{ maxWidth: '600px', width: '90%', padding: '40px' }}>
                        <h2 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 800 }}>Complete Interview</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Provide a final summary and candidate assessment to close this session.</p>

                        <form onSubmit={handleCompleteInterview}>
                            <div className="form-group">
                                <label className="form-label">Interviewer Notes & Summary</label>
                                <textarea
                                    className="form-input"
                                    rows="6"
                                    style={{ height: 'auto', resize: 'vertical' }}
                                    placeholder="Assess candidate skills, behavior, and final verdict..."
                                    value={interviewerNotes}
                                    onChange={e => setInterviewerNotes(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                                <button type="button" className="btn btn-outline btn-full" onClick={() => setShowReportModal(false)} disabled={completing}>
                                    Go Back
                                </button>
                                <button type="submit" className="btn btn-primary btn-full" disabled={completing} style={{ background: 'var(--success)' }}>
                                    {completing ? 'Processing...' : 'Submit Final Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showSuccess && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '50px', textAlign: 'center', border: '4px solid var(--success)', boxShadow: '15px 15px 0 var(--border)' }}>
                        <div style={{ fontSize: '5rem', marginBottom: '24px' }}>🏆</div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '16px' }}>Interview Successful!</h2>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '40px', fontWeight: 600 }}>
                            "Your interview is successfully completed. All the best for your results!"
                        </p>
                        <button
                            className="btn btn-primary btn-full"
                            style={{ background: 'var(--text-primary)', padding: '20px' }}
                            onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}
                        >
                            GO TO DASHBOARD
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterviewRoom;
