const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

// Track active rooms: Map<interviewId, Set<socketId>>
const activeRooms = new Map();

const setupSocket = (io) => {
    // Auth middleware for Socket.io
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }
        try {
            const cleanToken = token.replace('Bearer ', '');
            const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
            socket.user = decoded;
            next();
        } catch (err) {
            next(new Error('Authentication error: Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id} (User: ${socket.user.name})`);

        // Emit current room statuses on connect
        const roomStatuses = {};
        activeRooms.forEach((users, roomId) => {
            roomStatuses[roomId] = { active: users.size > 0, participants: users.size };
        });
        socket.emit('rooms:status', roomStatuses);

        // Join interview room
        socket.on('room:join', async (data) => {
            try {
                const { interview_id } = data;

                if (!interview_id) {
                    socket.emit('room:error', { message: 'interview_id is required' });
                    return;
                }

                // Verify interview exists
                const interview = await pool.query(
                    'SELECT id, title, status FROM interviews WHERE id = $1',
                    [interview_id]
                );

                if (interview.rows.length === 0) {
                    socket.emit('room:error', { message: 'Interview not found' });
                    return;
                }

                const roomId = `interview_${interview_id}`;

                // Join the socket room
                socket.join(roomId);
                socket.currentRoom = roomId;
                socket.interviewId = interview_id;

                // Track active users in room
                if (!activeRooms.has(interview_id)) {
                    activeRooms.set(interview_id, new Set());
                }
                activeRooms.get(interview_id).add(socket.id);

                const participantCount = activeRooms.get(interview_id).size;

                // Notify everyone in the room
                io.to(roomId).emit('room:status', {
                    interview_id,
                    status: 'active',
                    participants: participantCount,
                    message: `${socket.user.name} joined the room`,
                    joinedUser: { id: socket.user.id, name: socket.user.name },
                    timestamp: new Date().toISOString(),
                });

                // Broadcast updated room status to ALL connected clients
                io.emit('room:updated', {
                    interview_id,
                    active: true,
                    participants: participantCount,
                });

                console.log(`📥 ${socket.user.name} joined room ${roomId} (${participantCount} participants)`);
            } catch (err) {
                console.error('room:join error:', err);
                socket.emit('room:error', { message: 'Failed to join room' });
            }
        });

        // Leave interview room
        socket.on('room:leave', (data) => {
            const { interview_id } = data || {};
            handleLeave(socket, io, interview_id || socket.interviewId);
        });

        // Send message in room (basic chat)
        socket.on('room:message', (data) => {
            const { interview_id, message } = data;
            const roomId = `interview_${interview_id}`;

            io.to(roomId).emit('room:message', {
                user: { id: socket.user.id, name: socket.user.name },
                message,
                timestamp: new Date().toISOString(),
            });
        });

        // Get room status
        socket.on('room:getStatus', (data) => {
            const { interview_id } = data;
            const participants = activeRooms.get(interview_id);
            socket.emit('room:status', {
                interview_id,
                active: participants ? participants.size > 0 : false,
                participants: participants ? participants.size : 0,
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 Socket disconnected: ${socket.id} (User: ${socket.user.name})`);
            if (socket.interviewId) {
                handleLeave(socket, io, socket.interviewId);
            }
        });
    });
};

const handleLeave = (socket, io, interview_id) => {
    if (!interview_id) return;

    const roomId = `interview_${interview_id}`;
    socket.leave(roomId);

    if (activeRooms.has(interview_id)) {
        activeRooms.get(interview_id).delete(socket.id);
        const participantCount = activeRooms.get(interview_id).size;

        if (participantCount === 0) {
            activeRooms.delete(interview_id);
        }

        io.to(roomId).emit('room:status', {
            interview_id,
            status: participantCount > 0 ? 'active' : 'inactive',
            participants: participantCount,
            message: `${socket.user.name} left the room`,
            leftUser: { id: socket.user.id, name: socket.user.name },
            timestamp: new Date().toISOString(),
        });

        io.emit('room:updated', {
            interview_id,
            active: participantCount > 0,
            participants: participantCount,
        });

        console.log(`📤 ${socket.user.name} left room ${roomId} (${participantCount} participants remaining)`);
    }
};

// Get current room statuses (for HTTP endpoint)
const getRoomStatuses = () => {
    const statuses = {};
    activeRooms.forEach((users, roomId) => {
        statuses[roomId] = { active: users.size > 0, participants: users.size };
    });
    return statuses;
};

module.exports = { setupSocket, getRoomStatuses };
