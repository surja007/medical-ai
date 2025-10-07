const express = require('express');
const SearchHistory = require('../models/SearchHistory');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/search-history
// @desc    Get user's search history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, limit = 20, page = 1 } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (type) {
      query.searchType = type;
    }

    const searches = await SearchHistory.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await SearchHistory.countDocuments(query);

    const searchSummaries = searches.map(search => search.getSummary());

    res.json({
      success: true,
      searches: searchSummaries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Get search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving search history'
    });
  }
});

// @route   GET /api/search-history/analytics
// @desc    Get search analytics for user
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;

    const analytics = await SearchHistory.getSearchAnalytics(userId, parseInt(days));
    
    const totalSearches = analytics.reduce((sum, item) => sum + item.count, 0);
    
    res.json({
      success: true,
      analytics: {
        totalSearches,
        byType: analytics,
        period: `${days} days`
      }
    });
  } catch (error) {
    logger.error('Get search analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving search analytics'
    });
  }
});

// @route   GET /api/search-history/recent/:type
// @desc    Get recent searches by type
// @access  Private
router.get('/recent/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 5 } = req.query;
    const userId = req.user.id;

    const searches = await SearchHistory.getRecentSearches(userId, type, parseInt(limit));
    
    res.json({
      success: true,
      searches: searches.map(search => search.getSummary())
    });
  } catch (error) {
    logger.error('Get recent searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving recent searches'
    });
  }
});

// @route   DELETE /api/search-history/:id
// @desc    Delete specific search from history
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const search = await SearchHistory.findOneAndDelete({
      _id: id,
      userId
    });

    if (!search) {
      return res.status(404).json({
        success: false,
        message: 'Search history item not found'
      });
    }

    res.json({
      success: true,
      message: 'Search history item deleted'
    });
  } catch (error) {
    logger.error('Delete search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting search history'
    });
  }
});

// @route   DELETE /api/search-history
// @desc    Clear all search history for user
// @access  Private
router.delete('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (type) {
      query.searchType = type;
    }

    const result = await SearchHistory.deleteMany(query);

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} search history items`
    });
  } catch (error) {
    logger.error('Clear search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing search history'
    });
  }
});

module.exports = router;