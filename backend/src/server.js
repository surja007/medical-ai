const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const SessionCleanupJob = require('./jobs/sessionCleanup');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const symptomRoutes = require('./routes/symptoms');
const imageRoutes = require('./routes/images');
const wearableRoutes = require('./routes/wearables');
const familyRoutes = require('./routes/family');
const assistantRoutes = require('./routes/assistant');
const communicationRoutes = require('./routes/communication');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting (disabled in development)
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX || 100,
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use(limiter);
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/wearables', wearableRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/search-history', require('./routes/searchHistory'));

// Socket.io for real-time communication
require('./sockets/socketHandler')(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  
  // Start session cleanup jobs
  SessionCleanupJob.start();
  
  // Run initial cleanup
  SessionCleanupJob.runOnce().catch(err => {
    logger.error('Initial session cleanup failed:', err);
  });
});

module.exports = { app, server, io };