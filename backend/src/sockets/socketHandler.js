const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.userId}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining specific rooms (consultations, emergency alerts, etc.)
    socket.on('join-room', (roomId) => {
      socket.join(roomId);
      logger.info(`User ${socket.userId} joined room: ${roomId}`);
    });

    socket.on('leave-room', (roomId) => {
      socket.leave(roomId);
      logger.info(`User ${socket.userId} left room: ${roomId}`);
    });

    // Handle chat messages
    socket.on('send-message', (data) => {
      const { roomId, message, type } = data;
      
      // Broadcast message to room
      socket.to(roomId).emit('receive-message', {
        senderId: socket.userId,
        message,
        type,
        timestamp: new Date()
      });
    });

    // Handle video call signaling
    socket.on('video-call-offer', (data) => {
      const { targetUserId, offer } = data;
      socket.to(`user:${targetUserId}`).emit('video-call-offer', {
        callerId: socket.userId,
        offer
      });
    });

    socket.on('video-call-answer', (data) => {
      const { callerId, answer } = data;
      socket.to(`user:${callerId}`).emit('video-call-answer', {
        answer
      });
    });

    socket.on('video-call-ice-candidate', (data) => {
      const { targetUserId, candidate } = data;
      socket.to(`user:${targetUserId}`).emit('video-call-ice-candidate', {
        candidate
      });
    });

    socket.on('video-call-end', (data) => {
      const { targetUserId } = data;
      socket.to(`user:${targetUserId}`).emit('video-call-end');
    });

    // Handle emergency alerts
    socket.on('emergency-alert', (data) => {
      const { location, symptoms, severity } = data;
      
      // Notify emergency responders in the area
      socket.broadcast.emit('emergency-alert', {
        userId: socket.userId,
        location,
        symptoms,
        severity,
        timestamp: new Date()
      });
      
      logger.warn(`Emergency alert from user ${socket.userId}:`, data);
    });

    // Handle health data updates
    socket.on('health-data-update', (data) => {
      // Broadcast to connected healthcare providers
      if (socket.userRole === 'patient') {
        socket.broadcast.to('healthcare-providers').emit('patient-health-update', {
          patientId: socket.userId,
          data,
          timestamp: new Date()
        });
      }
    });

    // Handle typing indicators
    socket.on('typing-start', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user-typing', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user-typing', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle presence updates
    socket.on('update-presence', (status) => {
      socket.broadcast.emit('user-presence-update', {
        userId: socket.userId,
        status,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.userId}, reason: ${reason}`);
      
      // Notify others about user going offline
      socket.broadcast.emit('user-presence-update', {
        userId: socket.userId,
        status: 'offline',
        timestamp: new Date()
      });
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Helper function to send notification to specific user
  const sendNotificationToUser = (userId, notification) => {
    io.to(`user:${userId}`).emit('notification', notification);
  };

  // Helper function to broadcast emergency alert
  const broadcastEmergencyAlert = (alert) => {
    io.emit('emergency-broadcast', alert);
  };

  // Export helper functions for use in other parts of the application
  io.sendNotificationToUser = sendNotificationToUser;
  io.broadcastEmergencyAlert = broadcastEmergencyAlert;
};