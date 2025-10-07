const mongoose = require('mongoose');

const healthAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  familyGroup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyGroup'
  },
  alertType: {
    type: String,
    enum: [
      'heart_rate_high',
      'heart_rate_low', 
      'blood_pressure_high',
      'blood_pressure_low',
      'irregular_heartbeat',
      'fall_detection',
      'inactivity',
      'sleep_disturbance',
      'medication_reminder',
      'emergency_button',
      'device_disconnected',
      'battery_low',
      'custom'
    ],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical', 'emergency'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  healthData: {
    heartRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    steps: Number,
    sleepHours: Number,
    deviceBattery: Number,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    },
    timestamp: Date,
    deviceType: String,
    rawData: mongoose.Schema.Types.Mixed
  },
  recipients: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notificationMethod: {
      type: String,
      enum: ['push', 'sms', 'email', 'call'],
      default: 'push'
    },
    sentAt: Date,
    readAt: Date,
    acknowledgedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'read', 'acknowledged', 'failed'],
      default: 'pending'
    }
  }],
  actions: [{
    type: {
      type: String,
      enum: ['call_emergency', 'contact_doctor', 'take_medication', 'check_vitals', 'custom']
    },
    description: String,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completedAt: Date,
    notes: String
  }],
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  resolutionNotes: String,
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  autoEscalateAt: Date,
  metadata: {
    deviceId: String,
    appVersion: String,
    platform: String,
    userAgent: String
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
healthAlertSchema.index({ user: 1, createdAt: -1 });
healthAlertSchema.index({ familyGroup: 1, createdAt: -1 });
healthAlertSchema.index({ alertType: 1, severity: 1 });
healthAlertSchema.index({ isResolved: 1, createdAt: -1 });
healthAlertSchema.index({ 'recipients.user': 1, 'recipients.status': 1 });

// Virtual for alert age
healthAlertSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Method to check if alert needs escalation
healthAlertSchema.methods.needsEscalation = function() {
  if (this.isResolved) return false;
  
  const criticalAlerts = ['emergency_button', 'fall_detection', 'heart_rate_high'];
  if (criticalAlerts.includes(this.alertType)) {
    return this.ageInMinutes > 5; // Escalate critical alerts after 5 minutes
  }
  
  if (this.severity === 'emergency') {
    return this.ageInMinutes > 2; // Escalate emergency alerts after 2 minutes
  }
  
  if (this.severity === 'critical') {
    return this.ageInMinutes > 10; // Escalate critical alerts after 10 minutes
  }
  
  return false;
};

// Method to get unacknowledged recipients
healthAlertSchema.methods.getUnacknowledgedRecipients = function() {
  return this.recipients.filter(recipient => 
    !recipient.acknowledgedAt && recipient.status !== 'failed'
  );
};

// Static method to get active alerts for user
healthAlertSchema.statics.getActiveAlertsForUser = function(userId) {
  return this.find({
    $or: [
      { user: userId },
      { 'recipients.user': userId }
    ],
    isResolved: false
  }).sort({ createdAt: -1 });
};

// Static method to get family alerts
healthAlertSchema.statics.getFamilyAlerts = function(familyGroupId, limit = 50) {
  return this.find({
    familyGroup: familyGroupId
  })
  .populate('user', 'firstName lastName')
  .sort({ createdAt: -1 })
  .limit(limit);
};

healthAlertSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('HealthAlert', healthAlertSchema);