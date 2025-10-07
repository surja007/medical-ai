const SessionService = require('../services/SessionService');
const logger = require('../utils/logger');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    // Validate JWT and get session
    const { user, session } = await SessionService.validateJWT(token);
    
    if (!user || !session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or session expired'
      });
    }

    // Add user and session to request
    req.user = user;
    req.session = session;
    
    // Store device info for session tracking
    req.deviceInfo = {
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    next();
  };
};

module.exports = { auth, authorize };