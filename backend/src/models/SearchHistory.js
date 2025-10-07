const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  searchType: {
    type: String,
    enum: ['symptoms', 'images', 'doctors', 'assistant', 'wearables'],
    required: true
  },
  query: {
    type: String,
    required: true
  },
  searchData: {
    // For symptoms: symptom names and details
    symptoms: [{
      name: String,
      severity: Number,
      duration: String,
      bodyPart: String
    }],
    // For images: image metadata
    imageInfo: {
      fileName: String,
      fileSize: Number,
      mimeType: String,
      bodyPart: String
    },
    // For doctors: search criteria
    doctorSearch: {
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      },
      specialty: String,
      distance: Number,
      filters: mongoose.Schema.Types.Mixed
    },
    // For assistant: conversation context
    assistantQuery: {
      message: String,
      context: mongoose.Schema.Types.Mixed
    },
    // Additional metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  results: {
    count: {
      type: Number,
      default: 0
    },
    // Store key results for quick access
    summary: mongoose.Schema.Types.Mixed
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    },
    address: String
  },
  userAgent: String,
  ipAddress: String,
  sessionId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
searchHistorySchema.index({ userId: 1, createdAt: -1 });
searchHistorySchema.index({ userId: 1, searchType: 1, createdAt: -1 });
searchHistorySchema.index({ location: '2dsphere' });
searchHistorySchema.index({ query: 'text' });

// Virtual for formatted date
searchHistorySchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to get search summary
searchHistorySchema.methods.getSummary = function() {
  const summary = {
    id: this._id,
    type: this.searchType,
    query: this.query,
    date: this.createdAt,
    resultsCount: this.results.count
  };

  switch (this.searchType) {
    case 'symptoms':
      summary.symptoms = this.searchData.symptoms?.map(s => s.name).join(', ') || '';
      break;
    case 'doctors':
      summary.location = this.searchData.doctorSearch?.location?.address || '';
      summary.specialty = this.searchData.doctorSearch?.specialty || '';
      break;
    case 'images':
      summary.bodyPart = this.searchData.imageInfo?.bodyPart || '';
      break;
    case 'assistant':
      summary.message = this.searchData.assistantQuery?.message || '';
      break;
  }

  return summary;
};

// Static method to get user's recent searches
searchHistorySchema.statics.getRecentSearches = function(userId, searchType = null, limit = 10) {
  const query = { userId };
  if (searchType) {
    query.searchType = searchType;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('searchType query searchData results createdAt');
};

// Static method to get search analytics
searchHistorySchema.statics.getSearchAnalytics = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$searchType',
        count: { $sum: 1 },
        lastSearch: { $max: '$createdAt' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

module.exports = mongoose.model('SearchHistory', searchHistorySchema);