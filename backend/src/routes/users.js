const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().trim().isLength({ min: 2 }),
  body('lastName').optional().trim().isLength({ min: 2 }),
  body('phoneNumber').optional().isMobilePhone(),
  body('dateOfBirth').optional().isISO8601()
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

    const allowedUpdates = [
      'firstName', 'lastName', 'phoneNumber', 'dateOfBirth', 
      'gender', 'emergencyContact', 'medicalHistory', 'preferences'
    ];
    
    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    logger.info(`Profile updated for user: ${req.user.id}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/medical-history
// @desc    Add medical history entry
// @access  Private
router.post('/medical-history', [
  auth,
  body('type').isIn(['allergy', 'medication', 'condition', 'surgery']),
  body('name').trim().isLength({ min: 1 }),
  body('details').optional().trim()
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

    const { type, name, details } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.medicalHistory) {
      user.medicalHistory = {
        allergies: [],
        medications: [],
        conditions: [],
        surgeries: []
      };
    }

    const entry = details ? `${name} - ${details}` : name;
    
    switch (type) {
      case 'allergy':
        user.medicalHistory.allergies.push(entry);
        break;
      case 'medication':
        user.medicalHistory.medications.push(entry);
        break;
      case 'condition':
        user.medicalHistory.conditions.push(entry);
        break;
      case 'surgery':
        user.medicalHistory.surgeries.push(entry);
        break;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Medical history updated',
      medicalHistory: user.medicalHistory
    });
  } catch (error) {
    logger.error('Add medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/medical-history
// @desc    Remove medical history entry
// @access  Private
router.delete('/medical-history', [
  auth,
  body('type').isIn(['allergy', 'medication', 'condition', 'surgery']),
  body('index').isInt({ min: 0 })
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

    const { type, index } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.medicalHistory) {
      return res.status(400).json({
        success: false,
        message: 'No medical history found'
      });
    }

    const typeMap = {
      allergy: 'allergies',
      medication: 'medications',
      condition: 'conditions',
      surgery: 'surgeries'
    };

    const arrayName = typeMap[type];
    if (user.medicalHistory[arrayName] && user.medicalHistory[arrayName][index]) {
      user.medicalHistory[arrayName].splice(index, 1);
      await user.save();
    }

    res.json({
      success: true,
      message: 'Medical history entry removed',
      medicalHistory: user.medicalHistory
    });
  } catch (error) {
    logger.error('Remove medical history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/preferences
// @desc    Update user preferences
// @access  Private
router.put('/preferences', auth, async (req, res) => {
  try {
    const { notifications, language, timezone } = req.body;
    
    const user = await User.findById(req.user.id);
    
    if (notifications) {
      user.preferences.notifications = {
        ...user.preferences.notifications,
        ...notifications
      };
    }
    
    if (language) {
      user.preferences.language = language;
    }
    
    if (timezone) {
      user.preferences.timezone = timezone;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated',
      preferences: user.preferences
    });
  } catch (error) {
    logger.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;