const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const { setupSocket, getRoomStatuses } = require('./socket/socketHandler');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Interview Platform API Docs',
}));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));

// Room status endpoint
app.get('/api/rooms/status', (req, res) => {
    res.json({ rooms: getRoomStatuses() });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
    });
});

// API info
app.get('/', (req, res) => {
    res.json({
        name: 'Real-Time Interview Platform API',
        version: '1.0.0',
        docs: '/api/docs',
        health: '/api/health',
        endpoints: {
            auth: '/api/auth',
            interviews: '/api/interviews',
            bookings: '/api/bookings',
            rooms: '/api/rooms',
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Setup Socket.io
setupSocket(io);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`\n🚀 Interview Platform API running on port ${PORT}`);
        console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
        console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
}

module.exports = { app, server };
