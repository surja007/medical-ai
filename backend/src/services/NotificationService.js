const logger = require('../utils/logger');
const User = require('../models/User');

class NotificationService {
  constructor() {
    // In production, initialize services like:
    // - Twilio for SMS
    // - SendGrid for email
    // - Firebase for push notifications
    // - Voice calling service
  }

  // Send health alert notification
  async sendHealthAlert(userId, alert, method = 'push') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      switch (method) {
        case 'push':
          return await this.sendPushNotification(user, alert);
        case 'sms':
          return await this.sendSMS(user, alert);
        case 'email':
          return await this.sendEmail(user, alert);
        case 'call':
          return await this.makeVoiceCall(user, alert);
        default:
          return await this.sendPushNotification(user, alert);
      }
    } catch (error) {
      logger.error(`Error sending ${method} notification:`, error);
      throw error;
    }
  }

  // Send push notification
  async sendPushNotification(user, alert) {
    try {
      // Mock implementation - in production, use Firebase Cloud Messaging
      const notification = {
        title: alert.title,
        body: alert.message,
        data: {
          alertId: alert._id.toString(),
          alertType: alert.alertType,
          severity: alert.severity,
          userId: alert.user.toString()
        },
        priority: alert.severity === 'emergency' ? 'high' : 'normal'
      };

      logger.info(`Push notification sent to ${user.email}:`, notification.title);
      
      // Simulate successful delivery
      return {
        success: true,
        method: 'push',
        messageId: `push_${Date.now()}`,
        deliveredAt: new Date()
      };
    } catch (error) {
      logger.error('Push notification error:', error);
      return {
        success: false,
        method: 'push',
        error: error.message
      };
    }
  }

  // Send SMS notification
  async sendSMS(user, alert) {
    try {
      // Mock implementation - in production, use Twilio
      const message = this.formatSMSMessage(alert, user);
      
      logger.info(`SMS sent to ${user.phoneNumber}: ${message}`);
      
      // Simulate successful delivery
      return {
        success: true,
        method: 'sms',
        messageId: `sms_${Date.now()}`,
        deliveredAt: new Date(),
        phoneNumber: user.phoneNumber
      };
    } catch (error) {
      logger.error('SMS error:', error);
      return {
        success: false,
        method: 'sms',
        error: error.message
      };
    }
  }

  // Send email notification
  async sendEmail(user, alert) {
    try {
      // Mock implementation - in production, use SendGrid or similar
      const emailContent = this.formatEmailContent(alert, user);
      
      logger.info(`Email sent to ${user.email}: ${alert.title}`);
      
      // Simulate successful delivery
      return {
        success: true,
        method: 'email',
        messageId: `email_${Date.now()}`,
        deliveredAt: new Date(),
        email: user.email
      };
    } catch (error) {
      logger.error('Email error:', error);
      return {
        success: false,
        method: 'email',
        error: error.message
      };
    }
  }

  // Make voice call
  async makeVoiceCall(user, alert) {
    try {
      // Mock implementation - in production, use Twilio Voice API
      const callMessage = this.formatVoiceMessage(alert, user);
      
      logger.info(`Voice call initiated to ${user.phoneNumber}: ${alert.title}`);
      
      // Simulate successful call
      return {
        success: true,
        method: 'call',
        callId: `call_${Date.now()}`,
        initiatedAt: new Date(),
        phoneNumber: user.phoneNumber,
        duration: 30 // seconds
      };
    } catch (error) {
      logger.error('Voice call error:', error);
      return {
        success: false,
        method: 'call',
        error: error.message
      };
    }
  }

  // Format SMS message
  formatSMSMessage(alert, user) {
    const familyMember = alert.user.toString() !== user._id.toString() 
      ? 'A family member' 
      : 'You';
    
    let message = `🚨 HEALTH ALERT: ${alert.title}\n\n`;
    message += `${familyMember} ${alert.message}\n\n`;
    
    if (alert.severity === 'emergency') {
      message += '⚠️ This is an EMERGENCY alert. Please respond immediately.\n\n';
    }
    
    message += `Time: ${alert.createdAt.toLocaleString()}\n`;
    message += `View details: [App Link]`;
    
    return message;
  }

  // Format email content
  formatEmailContent(alert, user) {
    const familyMember = alert.user.toString() !== user._id.toString() 
      ? 'a family member' 
      : 'you';
    
    return {
      subject: `🚨 Health Alert: ${alert.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${this.getSeverityColor(alert.severity)}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">🚨 Health Alert</h1>
            <h2 style="margin: 10px 0 0 0;">${alert.title}</h2>
          </div>
          
          <div style="padding: 20px; background: #f9f9f9;">
            <p><strong>Alert for:</strong> ${familyMember}</p>
            <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
            <p><strong>Time:</strong> ${alert.createdAt.toLocaleString()}</p>
            
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Details:</strong></p>
              <p>${alert.message}</p>
            </div>
            
            ${alert.healthData ? this.formatHealthDataHTML(alert.healthData) : ''}
            
            ${alert.actions && alert.actions.length > 0 ? `
              <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <p><strong>Recommended Actions:</strong></p>
                <ul>
                  ${alert.actions.map(action => `<li>${action.description}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="#" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
                View in App
              </a>
            </div>
            
            ${alert.severity === 'emergency' ? `
              <div style="background: #dc3545; color: white; padding: 15px; border-radius: 5px; text-align: center;">
                <strong>⚠️ EMERGENCY ALERT</strong><br>
                This requires immediate attention. If this is a medical emergency, call emergency services immediately.
              </div>
            ` : ''}
          </div>
          
          <div style="background: #6c757d; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p>This is an automated health alert from your Smart Health Platform.</p>
            <p>If you believe this is a medical emergency, call emergency services immediately.</p>
          </div>
        </div>
      `
    };
  }

  // Format voice message
  formatVoiceMessage(alert, user) {
    const familyMember = alert.user.toString() !== user._id.toString() 
      ? 'a family member' 
      : 'you';
    
    let message = `This is a health alert from Smart Health Platform. `;
    
    if (alert.severity === 'emergency') {
      message += `This is an emergency alert. `;
    }
    
    message += `${alert.title}. `;
    message += `Alert for ${familyMember}. `;
    message += `${alert.message} `;
    
    if (alert.severity === 'emergency') {
      message += `Please respond immediately or call emergency services if needed. `;
    }
    
    message += `Check your Smart Health app for more details. Thank you.`;
    
    return message;
  }

  // Format health data for email
  formatHealthDataHTML(healthData) {
    let html = '<div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0;">';
    html += '<p><strong>Health Data:</strong></p>';
    
    if (healthData.heartRate) {
      html += `<p>❤️ Heart Rate: ${healthData.heartRate} BPM</p>`;
    }
    
    if (healthData.bloodPressure) {
      html += `<p>🩸 Blood Pressure: ${healthData.bloodPressure.systolic}/${healthData.bloodPressure.diastolic} mmHg</p>`;
    }
    
    if (healthData.temperature) {
      html += `<p>🌡️ Temperature: ${healthData.temperature}°C</p>`;
    }
    
    if (healthData.oxygenSaturation) {
      html += `<p>🫁 Oxygen Saturation: ${healthData.oxygenSaturation}%</p>`;
    }
    
    if (healthData.location) {
      html += `<p>📍 Location: ${healthData.location.address || 'Location available'}</p>`;
    }
    
    if (healthData.deviceType) {
      html += `<p>📱 Device: ${healthData.deviceType}</p>`;
    }
    
    html += '</div>';
    return html;
  }

  // Get color based on severity
  getSeverityColor(severity) {
    switch (severity) {
      case 'emergency':
        return '#dc3545'; // Red
      case 'critical':
        return '#fd7e14'; // Orange
      case 'high':
        return '#ffc107'; // Yellow
      case 'medium':
        return '#17a2b8'; // Cyan
      case 'low':
        return '#28a745'; // Green
      default:
        return '#6c757d'; // Gray
    }
  }

  // Send family daily summary
  async sendFamilyDailySummary(familyGroupId) {
    try {
      // Implementation for daily family health summary
      logger.info(`Daily summary sent for family group ${familyGroupId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error sending daily summary:', error);
      throw error;
    }
  }

  // Send medication reminder
  async sendMedicationReminder(userId, medication) {
    try {
      const user = await User.findById(userId);
      
      const notification = {
        title: '💊 Medication Reminder',
        body: `Time to take your ${medication.name}`,
        data: {
          type: 'medication_reminder',
          medicationId: medication.id
        }
      };

      await this.sendPushNotification(user, notification);
      logger.info(`Medication reminder sent to ${user.email}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error sending medication reminder:', error);
      throw error;
    }
  }

  // Send device connection status
  async sendDeviceStatusNotification(userId, deviceType, status) {
    try {
      const user = await User.findById(userId);
      
      const notification = {
        title: '📱 Device Status',
        body: `Your ${deviceType} is ${status}`,
        data: {
          type: 'device_status',
          deviceType,
          status
        }
      };

      await this.sendPushNotification(user, notification);
      logger.info(`Device status notification sent to ${user.email}`);
      
      return { success: true };
    } catch (error) {
      logger.error('Error sending device status notification:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();