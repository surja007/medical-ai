const express = require('express');
const { body, validationResult } = require('express-validator');
const SymptomAnalysis = require('../models/SymptomAnalysis');
const { auth } = require('../middleware/auth');
const GeminiService = require('../services/GeminiService');
const SearchHistoryService = require('../services/SearchHistoryService');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/symptoms/analyze
// @desc    Analyze symptoms using AI
// @access  Private
router.post('/analyze', [
  auth,
  body('symptoms').isArray({ min: 1 }).withMessage('At least one symptom is required'),
  body('symptoms.*.name').trim().isLength({ min: 1 }).withMessage('Symptom name is required'),
  body('symptoms.*.severity').isInt({ min: 1, max: 10 }).withMessage('Severity must be between 1-10'),
  body('symptoms.*.duration').trim().isLength({ min: 1 }).withMessage('Duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { symptoms, additionalInfo } = req.body;
    const userId = req.user.id;

    // Create initial symptom analysis record
    const symptomAnalysis = new SymptomAnalysis({
      userId,
      symptoms,
      additionalInfo: {
        ...additionalInfo,
        age: req.user.dateOfBirth ? 
          Math.floor((new Date() - new Date(req.user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
          additionalInfo.age,
        gender: req.user.gender || additionalInfo.gender
      }
    });

    // Analyze symptoms with Gemini AI
    const startTime = Date.now();
    const aiAnalysis = await GeminiService.analyzeSymptoms({
      symptoms,
      userInfo: {
        age: symptomAnalysis.additionalInfo.age,
        gender: symptomAnalysis.additionalInfo.gender,
        medicalHistory: req.user.medicalHistory?.conditions || [],
        currentMedications: req.user.medicalHistory?.medications || []
      },
      additionalInfo
    });
    const processingTime = Date.now() - startTime;

    // Update symptom analysis with AI results
    symptomAnalysis.aiAnalysis = aiAnalysis.analysis;
    symptomAnalysis.geminiResponse = {
      rawResponse: aiAnalysis.rawResponse,
      confidence: aiAnalysis.confidence,
      processingTime
    };
    symptomAnalysis.status = 'analyzed';
    symptomAnalysis.isEmergency = aiAnalysis.analysis.urgencyLevel === 'emergency';

    await symptomAnalysis.save();

    // If emergency, trigger alert
    if (symptomAnalysis.isEmergency) {
      // TODO: Implement emergency alert system
      logger.warn(`Emergency symptom analysis for user ${userId}: ${symptomAnalysis._id}`);
    }

    // Save to search history
    logger.info(`About to save search history for user ${userId}`);
    await SearchHistoryService.saveSymptomSearch(userId, symptoms, symptomAnalysis, req);
    logger.info(`Search history save attempt completed for user ${userId}`);

    logger.info(`Symptom analysis completed for user ${userId}: ${symptomAnalysis._id}`);

    res.status(201).json({
      success: true,
      message: 'Symptom analysis completed',
      analysis: symptomAnalysis,
      fallback: aiAnalysis.fallback || false
    });
  } catch (error) {
    logger.error('Symptom analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing symptoms'
    });
  }
});

// @route   GET /api/symptoms/history
// @desc    Get user's symptom analysis history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const analyses = await SymptomAnalysis.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('doctorReview.doctorId', 'firstName lastName');

    const total = await SymptomAnalysis.countDocuments(query);

    res.json({
      success: true,
      analyses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Get symptom history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving symptom history'
    });
  }
});

// @route   GET /api/symptoms/:id
// @desc    Get specific symptom analysis
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await SymptomAnalysis.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('doctorReview.doctorId', 'firstName lastName');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Symptom analysis not found'
      });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Get symptom analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving symptom analysis'
    });
  }
});

module.exports = router;