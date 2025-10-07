const mongoose = require('mongoose');

const symptomAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [{
    name: {
      type: String,
      required: true
    },
    severity: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    description: String,
    bodyPart: String
  }],
  additionalInfo: {
    age: Number,
    gender: String,
    medicalHistory: [String],
    currentMedications: [String],
    recentTravel: Boolean,
    recentIllness: Boolean
  },
  aiAnalysis: {
    possibleConditions: [{
      condition: String,
      probability: Number,
      severity: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical']
      },
      description: String,
      recommendations: [String]
    }],
    urgencyLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'emergency'],
      required: true
    },
    recommendedActions: [String],
    warningFlags: [String],
    followUpRecommended: Boolean,
    estimatedTimeToSeekCare: String
  },
  geminiResponse: {
    rawResponse: String,
    confidence: Number,
    processingTime: Number
  },
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'reviewed_by_doctor', 'closed'],
    default: 'pending'
  },
  doctorReview: {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
    diagnosis: String,
    treatment: String,
    reviewedAt: Date
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  emergencyAlertSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
symptomAnalysisSchema.index({ userId: 1, createdAt: -1 });
symptomAnalysisSchema.index({ 'aiAnalysis.urgencyLevel': 1 });
symptomAnalysisSchema.index({ isEmergency: 1 });

module.exports = mongoose.model('SymptomAnalysis', symptomAnalysisSchema);