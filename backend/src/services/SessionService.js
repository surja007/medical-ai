const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Session = require('../models/Session');
const User = require('../models/User');
const logger = require('../utils/logger');

class SessionService {
  // Create a new session
  static async createSession(userId, deviceInfo = {}, loginMethod = 'email') {
    try {
      // Generate tokens
      const sessionToken = this.generateSessionToken();
      const refreshToken = this.generateRefreshToken();
      
      // Create JWT payload
      const jwtPayload = {
        id: userId,
        sessionId: sessionToken,
        type: 'access'
      };

      // Generate JWT
      const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: '15m' // Short-lived access token
      });

      // Create session in database
      const session = new Session({
        userId,
        sessionToken,
        refreshToken,
        deviceInfo: {
          userAgent: deviceInfo.userAgent || '',
          ipAddress: deviceInfo.ipAddress || '',
          deviceType: this.detectDeviceType(deviceInfo.userAgent),
          browser: this.detectBrowser(deviceInfo.userAgent),
          os: this.detectOS(deviceInfo.userAgent)
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        loginMethod,
        location: deviceInfo.location || {}
      });

      await session.save();

      logger.info(`Session created for user ${userId}: ${sessionToken}`);

      return {
        accessToken,
        refreshToken,
        sessionToken,
        expiresIn: 15 * 60, // 15 minutes in seconds
        refreshExpiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
      };
    } catch (error) {
      logger.error('Create session error:', error);
      throw new Error('Failed to create session');
    }
  }

  // Validate session
  static async validateSession(sessionToken) {
    try {
      const session = await Session.findOne({
        sessionToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      }).populate('userId');

      if (!session) {
        return null;
      }

      // Update last activity
      session.lastActivity = new Date();
      await session.save();

      return session;
    } catch (error) {
      logger.error('Validate session error:', error);
      return null;
    }
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken) {
    try {
      const session = await Session.findOne({
        refreshToken,
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      if (!session) {
        throw new Error('Invalid refresh token');
      }

      // Generate new access token
      const jwtPayload = {
        id: session.userId,
        sessionId: session.sessionToken,
        type: 'access'
      };

      const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: '15m'
      });

      // Update session activity
      session.lastActivity = new Date();
      await session.save();

      logger.info(`Access token refreshed for session: ${session.sessionToken}`);

      return {
        accessToken,
        expiresIn: 15 * 60 // 15 minutes in seconds
      };
    } catch (error) {
      logger.error('Refresh token error:', error);
      throw new Error('Failed to refresh token');
    }
  }

  // Logout session
  static async logoutSession(sessionToken) {
    try {
      const session = await Session.findOne({ sessionToken });
      
      if (session) {
        session.isActive = false;
        await session.save();
        logger.info(`Session logged out: ${sessionToken}`);
      }

      return true;
    } catch (error) {
      logger.error('Logout session error:', error);
      throw new Error('Failed to logout session');
    }
  }

  // Logout all sessions for user
  static async logoutAllSessions(userId) {
    try {
      await Session.updateMany(
        { userId, isActive: true },
        { isActive: false }
      );

      logger.info(`All sessions logged out for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Logout all sessions error:', error);
      throw new Error('Failed to logout all sessions');
    }
  }

  // Get active sessions for user
  static async getActiveSessions(userId) {
    try {
      const sessions = await Session.getActiveSessions(userId);
      
      return sessions.map(session => ({
        sessionId: session.sessionToken,
        deviceInfo: session.deviceInfo,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        location: session.location,
        loginMethod: session.loginMethod
      }));
    } catch (error) {
      logger.error('Get active sessions error:', error);
      throw new Error('Failed to get active sessions');
    }
  }

  // Cleanup expired sessions
  static async cleanupExpiredSessions() {
    try {
      const result = await Session.cleanupExpired();
      logger.info(`Cleaned up ${result.deletedCount} expired sessions`);
      return result.deletedCount;
    } catch (error) {
      logger.error('Cleanup sessions error:', error);
      throw new Error('Failed to cleanup sessions');
    }
  }

  // Generate secure session token
  static generateSessionToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate secure refresh token
  static generateRefreshToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Detect device type from user agent
  static detectDeviceType(userAgent = '') {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  // Detect browser from user agent
  static detectBrowser(userAgent = '') {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }

  // Detect OS from user agent
  static detectOS(userAgent = '') {
    if (/windows/i.test(userAgent)) return 'Windows';
    if (/macintosh|mac os x/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/android/i.test(userAgent)) return 'Android';
    if (/iphone|ipad/i.test(userAgent)) return 'iOS';
    return 'Unknown';
  }

  // Validate JWT token and get session
  static async validateJWT(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      const session = await this.validateSession(decoded.sessionId);
      if (!session) {
        throw new Error('Session not found or expired');
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        throw new Error('User not found');
      }

      return { user, session };
    } catch (error) {
      logger.error('JWT validation error:', error);
      throw new Error('Invalid token');
    }
  }
}

module.exports = SessionService;