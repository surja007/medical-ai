const mongoose = require('mongoose');

const wearableDataSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['fitbit', 'apple_watch', 'garmin', 'samsung_health', 'xiaomi', 'huawei', 'custom'],
    required: true
  },
  dataType: {
    type: String,
    enum: [
      'heart_rate',
      'blood_pressure', 
      'steps',
      'calories',
      'sleep',
      'activity',
      'location',
      'fall_detection',
      'emergency_button',
      'battery_level',
      'temperature',
      'oxygen_saturation',
      'stress_level'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  data: {
    // Heart Rate Data
    heartRate: {
      bpm: Number,
      confidence: Number,
      context: {
        type: String,
        enum: ['resting', 'active', 'exercise', 'sleep']
      }
    },
    
    // Blood Pressure Data
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      pulse: Number,
      measurementMethod: String
    },
    
    // Activity Data
    steps: {
      count: Number,
      distance: Number, // in meters
      calories: Number,
      activeMinutes: Number
    },
    
    // Sleep Data
    sleep: {
      duration: Number, // in minutes
      efficiency: Number, // percentage
      stages: {
        deep: Number,
        light: Number,
        rem: Number,
        awake: Number
      },
      bedtime: Date,
      wakeTime: Date,
      quality: {
        type: String,
        enum: ['poor', 'fair', 'good', 'excellent']
      }
    },
    
    // Location Data
    location: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      address: String,
      isHome: Boolean,
      geofence: String
    },
    
    // Emergency Data
    emergency: {
      type: {
        type: String,
        enum: ['fall', 'button_press', 'no_movement', 'heart_rate_critical']
      },
      confidence: Number,
      autoDetected: Boolean,
      userConfirmed: Boolean,
      falseAlarm: Boolean
    },
    
    // Device Status
    device: {
      batteryLevel: Number,
      signalStrength: Number,
      lastSync: Date,
      firmwareVersion: String,
      isCharging: Boolean
    },
    
    // Biometric Data
    biometrics: {
      temperature: Number, // in Celsius
      oxygenSaturation: Number, // percentage
      stressLevel: Number, // 0-100
      respiratoryRate: Number,
      bloodGlucose: Number
    },
    
    // Raw sensor data
    rawData: mongoose.Schema.Types.Mixed
  },
  
  // Data quality and validation
  quality: {
    score: {
      type: Number,
      min: 0,
      max: 1,
      default: 1
    },
    issues: [String],
    validated: {
      type: Boolean,
      default: false
    },
    validatedBy: String
  },
  
  // Processing metadata
  processing: {
    processed: {
      type: Boolean,
      default: false
    },
    processedAt: Date,
    alertsGenerated: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HealthAlert'
    }],
    anomalyDetected: Boolean,
    anomalyScore: Number
  },
  
  // Sync information
  sync: {
    source: {
      type: String,
      enum: ['device', 'app', 'manual', 'api'],
      default: 'device'
    },
    syncedAt: Date,
    batchId: String,
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WearableData'
    }
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
wearableDataSchema.index({ user: 1, timestamp: -1 });
wearableDataSchema.index({ user: 1, dataType: 1, timestamp: -1 });
wearableDataSchema.index({ deviceId: 1, timestamp: -1 });
wearableDataSchema.index({ timestamp: -1, dataType: 1 });
wearableDataSchema.index({ 'processing.processed': 1, timestamp: 1 });

// Virtual for data age
wearableDataSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60));
});

// Method to check if data is recent
wearableDataSchema.methods.isRecent = function(minutes = 60) {
  return this.ageInMinutes <= minutes;
};

// Method to extract specific metric value
wearableDataSchema.methods.getValue = function() {
  switch (this.dataType) {
    case 'heart_rate':
      return this.data.heartRate?.bpm;
    case 'blood_pressure':
      return {
        systolic: this.data.bloodPressure?.systolic,
        diastolic: this.data.bloodPressure?.diastolic
      };
    case 'steps':
      return this.data.steps?.count;
    case 'sleep':
      return this.data.sleep?.duration;
    case 'temperature':
      return this.data.biometrics?.temperature;
    case 'oxygen_saturation':
      return this.data.biometrics?.oxygenSaturation;
    default:
      return null;
  }
};

// Static method to get latest data for user
wearableDataSchema.statics.getLatestForUser = function(userId, dataType, limit = 1) {
  const query = { user: userId };
  if (dataType) query.dataType = dataType;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(limit);
};

// Static method to get data in time range
wearableDataSchema.statics.getDataInRange = function(userId, dataType, startDate, endDate) {
  return this.find({
    user: userId,
    dataType: dataType,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: 1 });
};

// Static method to get aggregated daily data
wearableDataSchema.statics.getDailyAggregates = function(userId, dataType, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        dataType: dataType,
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        count: { $sum: 1 },
        avgValue: { $avg: '$data.heartRate.bpm' }, // Adjust based on dataType
        minValue: { $min: '$data.heartRate.bpm' },
        maxValue: { $max: '$data.heartRate.bpm' },
        firstReading: { $first: '$timestamp' },
        lastReading: { $last: '$timestamp' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
    }
  ]);
};

wearableDataSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('WearableData', wearableDataSchema);