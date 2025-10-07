const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const { body, validationResult } = require('express-validator');
const HealthImage = require('../models/HealthImage');
const { auth } = require('../middleware/auth');
const GeminiService = require('../services/GeminiService');
const logger = require('../utils/logger');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  },
});

// @route   POST /api/images/analyze
// @desc    Analyze health image using AI
// @access  Private
router.post('/analyze', [
  auth,
  upload.single('image'),
  body('imageType').isIn(['skin_condition', 'eye_condition', 'wound', 'rash', 'mole', 'x_ray', 'other']),
  body('bodyPart').optional().trim(),
  body('description').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    // Debug logging
    logger.info('Image analysis request received:', {
      body: req.body,
      hasFile: !!req.file,
      fileSize: req.file?.size,
      fileType: req.file?.mimetype
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Image analysis validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { imageType, bodyPart, description } = req.body;
    const userId = req.user.id;
    
    // Parse symptoms if provided
    let symptoms = [];
    if (req.body.symptoms) {
      if (Array.isArray(req.body.symptoms)) {
        symptoms = req.body.symptoms;
      } else if (typeof req.body.symptoms === 'string') {
        try {
          symptoms = JSON.parse(req.body.symptoms);
        } catch (e) {
          symptoms = [req.body.symptoms]; // Single symptom as string
        }
      }
    }

    // Process and optimize image
    const processedImage = await sharp(req.file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Convert to base64 for AI analysis
    const imageBase64 = processedImage.toString('base64');

    // Create initial health image record
    const healthImage = new HealthImage({
      userId,
      imageUrl: `data:image/jpeg;base64,${imageBase64}`,
      imageType,
      bodyPart,
      description,
      symptoms: symptoms || [],
      metadata: {
        fileSize: processedImage.length,
        dimensions: {
          width: 1024,
          height: 1024
        },
        format: 'jpeg'
      }
    });

    // Analyze image with Gemini AI
    const startTime = Date.now();
    logger.info(`Starting AI analysis for user ${userId}, image type: ${imageType}, body part: ${bodyPart}`);
    
    try {
      const aiAnalysis = await GeminiService.analyzeHealthImage(
        imageBase64,
        symptoms || [],
        bodyPart
      );
      const processingTime = Date.now() - startTime;
      logger.info(`AI analysis completed in ${processingTime}ms for user ${userId}`);

      // Update health image with AI results
      healthImage.aiAnalysis = aiAnalysis.analysis;
      healthImage.geminiAnalysis = {
        textualDescription: aiAnalysis.analysis.textualDescription,
        medicalInsights: aiAnalysis.analysis.medicalInsights,
        recommendations: aiAnalysis.analysis.recommendations,
        confidence: aiAnalysis.analysis.detectedConditions[0]?.confidence || 0.5
      };
      healthImage.status = 'analyzed';
      healthImage.isEmergency = aiAnalysis.analysis.urgencyLevel === 'emergency';

    } catch (aiError) {
      logger.error('AI analysis failed:', aiError);
      // Continue with basic analysis if AI fails
      healthImage.aiAnalysis = {
        detectedConditions: [{
          condition: "Analysis requires professional review",
          confidence: 0.5,
          severity: "moderate",
          description: "AI analysis unavailable, please consult a healthcare provider",
          recommendations: ["Consult with a healthcare provider"]
        }],
        imageQuality: { score: 0.7, issues: [] },
        urgencyLevel: "moderate",
        recommendedActions: ["Consult with a healthcare provider"],
        requiresProfessionalReview: true
      };
    }

    await healthImage.save();

    // If emergency, trigger alert
    if (healthImage.isEmergency) {
      logger.warn(`Emergency image analysis for user ${userId}: ${healthImage._id}`);
    }

    logger.info(`Image analysis completed for user ${userId}: ${healthImage._id}`);

    res.status(201).json({
      success: true,
      message: 'Image analysis completed',
      analysis: healthImage
    });
  } catch (error) {
    logger.error('Image analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing image'
    });
  }
});

// @route   GET /api/images/history
// @desc    Get user's image analysis history
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, imageType } = req.query;
    const userId = req.user.id;

    const query = { userId };
    if (imageType) {
      query.imageType = imageType;
    }

    const analyses = await HealthImage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('doctorReview.doctorId', 'firstName lastName');

    const total = await HealthImage.countDocuments(query);

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
    logger.error('Get image history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving image history'
    });
  }
});

// @route   GET /api/images/:id
// @desc    Get specific image analysis
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const analysis = await HealthImage.findOne({
      _id: req.params.id,
      userId: req.user.id
    }).populate('doctorReview.doctorId', 'firstName lastName');

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Image analysis not found'
      });
    }

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    logger.error('Get image analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving image analysis'
    });
  }
});

module.exports = router;