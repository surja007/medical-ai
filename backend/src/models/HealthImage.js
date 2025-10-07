const mongoose = require('mongoose');

const healthImageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  imageType: {
    type: String,
    enum: ['skin_condition', 'eye_condition', 'wound', 'rash', 'mole', 'x_ray', 'other'],
    required: true
  },
  bodyPart: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  symptoms: [String],
  aiAnalysis: {
    detectedConditions: [{
      condition: String,
      confidence: Number,
      severity: {
        type: String,
        enum: ['low', 'moderate', 'high', 'critical']
      },
      description: String,
      recommendations: [String]
    }],
    imageQuality: {
      score: Number,
      issues: [String]
    },
    urgencyLevel: {
      type: String,
      enum: ['low', 'moderate', 'high', 'emergency'],
      required: true
    },
    recommendedActions: [String],
    requiresProfessionalReview: Boolean
  },
  tensorflowAnalysis: {
    predictions: [{
      class: String,
      probability: Number
    }],
    processingTime: Number,
    modelVersion: String
  },
  geminiAnalysis: {
    textualDescription: String,
    medicalInsights: String,
    recommendations: [String],
    confidence: Number
  },
  doctorReview: {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    diagnosis: String,
    treatment: String,
    notes: String,
    reviewedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'reviewed_by_doctor', 'closed'],
    default: 'pending'
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  metadata: {
    fileSize: Number,
    dimensions: {
      width: Number,
      height: Number
    },
    format: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
healthImageSchema.index({ userId: 1, createdAt: -1 });
healthImageSchema.index({ imageType: 1 });
healthImageSchema.index({ 'aiAnalysis.urgencyLevel': 1 });
healthImageSchema.index({ isEmergency: 1 });

module.exports = mongoose.model('HealthImage', healthImageSchema);