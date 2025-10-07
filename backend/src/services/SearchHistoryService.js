const SearchHistory = require('../models/SearchHistory');
const logger = require('../utils/logger');

class SearchHistoryService {
  
  static async saveSymptomSearch(userId, symptoms, results, req) {
    try {
      logger.info(`Attempting to save symptom search for user ${userId}`);
      
      const searchHistory = new SearchHistory({
        userId,
        searchType: 'symptoms',
        query: symptoms.map(s => s.name).join(', '),
        searchData: {
          symptoms: symptoms.map(s => ({
            name: s.name,
            severity: s.severity,
            duration: s.duration,
            bodyPart: s.bodyPart
          }))
        },
        results: {
          count: 1,
          summary: {
            urgencyLevel: results.aiAnalysis?.urgencyLevel,
            conditionsCount: results.aiAnalysis?.possibleConditions?.length || 0
          }
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID
      });

      logger.info(`Search history object created, attempting to save...`);
      await searchHistory.save();
      logger.info(`Symptom search saved successfully for user ${userId} with ID: ${searchHistory._id}`);
      return searchHistory;
    } catch (error) {
      logger.error('Error saving symptom search history:', error);
      logger.error('Error details:', error.message);
      logger.error('Stack trace:', error.stack);
      // Don't throw the error to avoid breaking the main flow
    }
  }

  static async saveImageSearch(userId, imageInfo, bodyPart, results, req) {
    try {
      const searchHistory = new SearchHistory({
        userId,
        searchType: 'images',
        query: `Image analysis - ${bodyPart || 'General'}`,
        searchData: {
          imageInfo: {
            fileName: imageInfo.originalname,
            fileSize: imageInfo.size,
            mimeType: imageInfo.mimetype,
            bodyPart: bodyPart
          }
        },
        results: {
          count: 1,
          summary: {
            urgencyLevel: results.analysis?.urgencyLevel,
            conditionsCount: results.analysis?.detectedConditions?.length || 0
          }
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID
      });

      await searchHistory.save();
      logger.info(`Image search saved for user ${userId}`);
      return searchHistory;
    } catch (error) {
      logger.error('Error saving image search history:', error);
    }
  }

  static async saveDoctorSearch(userId, searchParams, results, req) {
    try {
      const { latitude, longitude, specialty, distance, address } = searchParams;
      
      const searchHistory = new SearchHistory({
        userId,
        searchType: 'doctors',
        query: `Doctors near ${address || 'current location'}${specialty ? ` - ${specialty}` : ''}`,
        searchData: {
          doctorSearch: {
            location: {
              latitude,
              longitude,
              address
            },
            specialty,
            distance,
            filters: searchParams.filters || {}
          }
        },
        results: {
          count: results.length || 0,
          summary: {
            nearbyDoctors: results.length,
            specialties: [...new Set(results.map(d => d.specialty))].slice(0, 3)
          }
        },
        location: {
          type: 'Point',
          coordinates: [longitude || 0, latitude || 0],
          address
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID
      });

      await searchHistory.save();
      logger.info(`Doctor search saved for user ${userId}`);
      return searchHistory;
    } catch (error) {
      logger.error('Error saving doctor search history:', error);
    }
  }

  static async saveAssistantChat(userId, message, response, context, req) {
    try {
      const searchHistory = new SearchHistory({
        userId,
        searchType: 'assistant',
        query: message.length > 100 ? message.substring(0, 100) + '...' : message,
        searchData: {
          assistantQuery: {
            message,
            context: context || {}
          }
        },
        results: {
          count: 1,
          summary: {
            responseLength: response.length,
            hasLocationContext: !!(context?.userLocation)
          }
        },
        location: context?.userLocation ? {
          type: 'Point',
          coordinates: [context.userLocation.longitude || 0, context.userLocation.latitude || 0]
        } : undefined,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID
      });

      await searchHistory.save();
      logger.info(`Assistant chat saved for user ${userId}`);
      return searchHistory;
    } catch (error) {
      logger.error('Error saving assistant chat history:', error);
    }
  }

  static async saveWearableSearch(userId, deviceType, dataType, results, req) {
    try {
      const searchHistory = new SearchHistory({
        userId,
        searchType: 'wearables',
        query: `${deviceType} - ${dataType} data`,
        searchData: {
          metadata: {
            deviceType,
            dataType,
            timeRange: results.timeRange
          }
        },
        results: {
          count: results.dataPoints?.length || 0,
          summary: {
            deviceType,
            dataType,
            recordsCount: results.dataPoints?.length || 0
          }
        },
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        sessionId: req.sessionID
      });

      await searchHistory.save();
      logger.info(`Wearable search saved for user ${userId}`);
      return searchHistory;
    } catch (error) {
      logger.error('Error saving wearable search history:', error);
    }
  }

  static async getRecentSearches(userId, type = null, limit = 10) {
    try {
      return await SearchHistory.getRecentSearches(userId, type, limit);
    } catch (error) {
      logger.error('Error getting recent searches:', error);
      return [];
    }
  }

  static async getSearchSuggestions(userId, type, query) {
    try {
      const searches = await SearchHistory.find({
        userId,
        searchType: type,
        query: { $regex: query, $options: 'i' }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('query searchData');

      return searches.map(search => ({
        query: search.query,
        data: search.searchData
      }));
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      return [];
    }
  }
}

module.exports = SearchHistoryService;