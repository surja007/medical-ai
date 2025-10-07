const cron = require('node-cron');
const SessionService = require('../services/SessionService');
const logger = require('../utils/logger');

class SessionCleanupJob {
  static start() {
    // Run cleanup every hour
    cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Starting session cleanup job...');
        const deletedCount = await SessionService.cleanupExpiredSessions();
        logger.info(`Session cleanup completed. Removed ${deletedCount} expired sessions.`);
      } catch (error) {
        logger.error('Session cleanup job failed:', error);
      }
    });

    // Run cleanup every 6 hours for more thorough cleanup
    cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('Starting thorough session cleanup...');
        
        // Additional cleanup for sessions inactive for more than 30 days
        const Session = require('../models/Session');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        const result = await Session.deleteMany({
          lastActivity: { $lt: thirtyDaysAgo }
        });
        
        logger.info(`Thorough cleanup completed. Removed ${result.deletedCount} old sessions.`);
      } catch (error) {
        logger.error('Thorough session cleanup failed:', error);
      }
    });

    logger.info('Session cleanup jobs scheduled');
  }

  static async runOnce() {
    try {
      logger.info('Running one-time session cleanup...');
      const deletedCount = await SessionService.cleanupExpiredSessions();
      logger.info(`One-time cleanup completed. Removed ${deletedCount} expired sessions.`);
      return deletedCount;
    } catch (error) {
      logger.error('One-time session cleanup failed:', error);
      throw error;
    }
  }
}

module.exports = SessionCleanupJob;