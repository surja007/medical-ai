const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const GeminiService = require('../services/GeminiService');
const freeHealthcareService = require('../services/freeHealthcareService');
const SearchHistoryService = require('../services/SearchHistoryService');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/assistant/chat
// @desc    Chat with AI health assistant with medical disclaimers and doctor suggestions
// @access  Private
router.post('/chat', [
  auth,
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required'),
  body('context').optional().isObject(),
  body('userLocation').optional().isObject()
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

    const { message, context = {}, userLocation } = req.body;
    const userId = req.user.id;

    // Build context for the assistant
    const assistantContext = {
      userProfile: {
        id: userId,
        firstName: req.user.firstName,
        age: req.user.dateOfBirth ? 
          Math.floor((new Date() - new Date(req.user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
          null,
        gender: req.user.gender,
        medicalHistory: req.user.medicalHistory
      },
      userLocation,
      ...context
    };

    // Get response from Gemini AI
    const aiResponse = await GeminiService.chatWithAssistant(message, assistantContext);

    // Get nearby doctors if location is provided
    let nearbyDoctors = [];
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      try {
        nearbyDoctors = await freeHealthcareService.searchNearbyHealthcare(
          userLocation.latitude,
          userLocation.longitude,
          10, // 10km radius
          null // no specific specialty
        );
        nearbyDoctors = nearbyDoctors.slice(0, 3); // Limit to top 3
      } catch (error) {
        logger.warn('Failed to fetch nearby doctors:', error.message);
      }
    }

    // Save to search history
    await SearchHistoryService.saveAssistantChat(userId, message, aiResponse.response, assistantContext, req);

    logger.info(`Assistant chat for user ${userId}: ${message.substring(0, 50)}...`);

    res.json({
      success: true,
      response: aiResponse.response,
      timestamp: aiResponse.timestamp,
      nearbyDoctors: nearbyDoctors,
      hasLocation: !!userLocation,
      disclaimer: {
        medical: "This information is for educational purposes only and should not replace professional medical advice.",
        emergency: "For emergencies, call 108 (India) or your local emergency number immediately.",
        consultation: "Always consult with a qualified healthcare provider for proper diagnosis and treatment."
      }
    });
  } catch (error) {
    logger.error('Assistant chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting assistant response'
    });
  }
});

// @route   GET /api/assistant/suggestions
// @desc    Get health suggestions based on user profile
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Generate personalized health suggestions
    const suggestions = [
      {
        id: 1,
        type: 'preventive',
        title: 'Schedule Annual Checkup',
        description: 'It\'s been a while since your last comprehensive health checkup.',
        priority: 'medium',
        action: 'Schedule appointment with your primary care physician'
      },
      {
        id: 2,
        type: 'lifestyle',
        title: 'Hydration Reminder',
        description: 'Make sure to drink at least 8 glasses of water daily.',
        priority: 'low',
        action: 'Set up water intake reminders'
      },
      {
        id: 3,
        type: 'exercise',
        title: 'Daily Movement',
        description: 'Aim for at least 30 minutes of physical activity today.',
        priority: 'medium',
        action: 'Take a walk or do light exercises'
      }
    ];

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    logger.error('Get suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving suggestions'
    });
  }
});

// @route   GET /api/assistant/health-tips
// @desc    Get daily health tips
// @access  Private
router.get('/health-tips', auth, async (req, res) => {
  try {
    const healthTips = [
      {
        id: 1,
        category: 'nutrition',
        title: 'Eat the Rainbow',
        tip: 'Include colorful fruits and vegetables in your meals to ensure a variety of nutrients.',
        source: 'WHO Nutrition Guidelines'
      },
      {
        id: 2,
        category: 'mental_health',
        title: 'Practice Mindfulness',
        tip: 'Take 5 minutes daily for deep breathing or meditation to reduce stress.',
        source: 'American Psychological Association'
      },
      {
        id: 3,
        category: 'sleep',
        title: 'Sleep Hygiene',
        tip: 'Maintain a consistent sleep schedule and avoid screens 1 hour before bedtime.',
        source: 'Sleep Foundation'
      },
      {
        id: 4,
        category: 'exercise',
        title: 'Move Regularly',
        tip: 'Take short walking breaks every hour if you have a sedentary job.',
        source: 'CDC Physical Activity Guidelines'
      }
    ];

    // Return a random tip for today
    const todaysTip = healthTips[Math.floor(Math.random() * healthTips.length)];

    res.json({
      success: true,
      tip: todaysTip,
      allTips: healthTips
    });
  } catch (error) {
    logger.error('Get health tips error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving health tips'
    });
  }
});

// @route   POST /api/assistant/doctor-suggestions
// @desc    Get doctor suggestions based on location and symptoms
// @access  Private
router.post('/doctor-suggestions', [
  auth,
  body('latitude').isFloat().withMessage('Valid latitude is required'),
  body('longitude').isFloat().withMessage('Valid longitude is required'),
  body('symptoms').optional().isArray(),
  body('specialty').optional().isString()
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

    const { latitude, longitude, symptoms = [], specialty } = req.body;
    const userId = req.user.id;

    // Determine specialty based on symptoms if not provided
    let suggestedSpecialty = specialty;
    if (!suggestedSpecialty && symptoms.length > 0) {
      suggestedSpecialty = determineSuggestedSpecialty(symptoms);
    }

    // Get nearby doctors
    const nearbyDoctors = await freeHealthcareService.searchNearbyHealthcare(
      latitude,
      longitude,
      15, // 15km radius for suggestions
      suggestedSpecialty
    );

    // Categorize doctors
    const categorizedDoctors = {
      emergency: nearbyDoctors.filter(d => d.type === 'hospital' && d.availability.includes('24/7')).slice(0, 2),
      specialists: nearbyDoctors.filter(d => d.specialty !== 'General Medicine').slice(0, 3),
      general: nearbyDoctors.filter(d => d.specialty === 'General Medicine').slice(0, 3),
      government: nearbyDoctors.filter(d => d.consultationFee < 200).slice(0, 2)
    };

    logger.info(`Doctor suggestions for user ${userId} at ${latitude}, ${longitude}`);

    res.json({
      success: true,
      suggestions: {
        location: { latitude, longitude },
        suggestedSpecialty,
        categories: categorizedDoctors,
        totalFound: nearbyDoctors.length,
        disclaimer: {
          medical: "These suggestions are based on location proximity and should not replace professional medical referrals.",
          emergency: "For medical emergencies, call 108 immediately or visit the nearest emergency room.",
          verification: "Please verify doctor credentials and availability before visiting."
        }
      }
    });
  } catch (error) {
    logger.error('Doctor suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting doctor suggestions'
    });
  }
});

// Helper function to determine specialty based on symptoms
function determineSuggestedSpecialty(symptoms) {
  const symptomSpecialtyMap = {
    'chest pain': 'Cardiology',
    'heart': 'Cardiology',
    'skin': 'Dermatology',
    'rash': 'Dermatology',
    'eye': 'Ophthalmology',
    'vision': 'Ophthalmology',
    'headache': 'Neurology',
    'bone': 'Orthopedics',
    'joint': 'Orthopedics',
    'child': 'Pediatrics',
    'mental': 'Psychiatry',
    'anxiety': 'Psychiatry',
    'depression': 'Psychiatry'
  };

  const symptomText = symptoms.join(' ').toLowerCase();
  
  for (const [keyword, specialty] of Object.entries(symptomSpecialtyMap)) {
    if (symptomText.includes(keyword)) {
      return specialty;
    }
  }
  
  return 'General Medicine';
}

module.exports = router;