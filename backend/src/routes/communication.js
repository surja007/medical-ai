const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');
const freeHealthcareService = require('../services/freeHealthcareService');
const SearchHistoryService = require('../services/SearchHistoryService');

const router = express.Router();

// @route   GET /api/communication/doctors
// @desc    Get available doctors for consultation with location-based search
// @access  Private
router.get('/doctors', auth, async (req, res) => {
  try {
    const { 
      specialty, 
      latitude, 
      longitude, 
      radius = 10, 
      sortBy = 'distance' 
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Location coordinates are required'
      });
    }

    const doctors = await freeHealthcareService.searchNearbyHealthcare(
      parseFloat(latitude), 
      parseFloat(longitude), 
      parseFloat(radius), // Keep in kilometers
      specialty
    );

    // Sort results
    let sortedDoctors = [...doctors];
    switch (sortBy) {
      case 'distance':
        sortedDoctors.sort((a, b) => a.distance - b.distance);
        break;
      case 'rating':
        sortedDoctors.sort((a, b) => b.rating - a.rating);
        break;
      case 'availability':
        // Prioritize open places
        sortedDoctors.sort((a, b) => {
          if (a.isOpen && !b.isOpen) return -1;
          if (!a.isOpen && b.isOpen) return 1;
          return a.distance - b.distance;
        });
        break;
      default:
        break;
    }

    // Save to search history
    await SearchHistoryService.saveDoctorSearch(
      req.user.id,
      {
        latitude,
        longitude,
        specialty,
        distance: radius,
        address: `${latitude}, ${longitude}`,
        filters: { sortBy }
      },
      sortedDoctors,
      req
    );

    res.json({
      success: true,
      doctors: sortedDoctors,
      total: sortedDoctors.length,
      searchParams: {
        specialty,
        radius: parseFloat(radius),
        sortBy,
        location: { latitude, longitude }
      }
    });
  } catch (error) {
    logger.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving doctors: ' + error.message
    });
  }
});



// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// @route   POST /api/communication/consultation
// @desc    Request a consultation with a doctor
// @access  Private
router.post('/consultation', [
  auth,
  body('doctorId').trim().isLength({ min: 1 }),
  body('type').isIn(['video', 'chat', 'phone']),
  body('urgency').isIn(['low', 'medium', 'high', 'emergency']),
  body('reason').trim().isLength({ min: 10, max: 500 }),
  body('preferredTime').optional().isISO8601()
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

    const { doctorId, type, urgency, reason, preferredTime } = req.body;
    const userId = req.user.id;

    // Mock consultation request - In production, this would create a proper consultation record
    const consultationRequest = {
      id: `consultation_${Date.now()}`,
      patientId: userId,
      doctorId,
      type,
      urgency,
      reason,
      preferredTime: preferredTime || new Date(),
      status: 'pending',
      createdAt: new Date(),
      estimatedDuration: type === 'video' ? 30 : 15, // minutes
      consultationFee: urgency === 'emergency' ? 150 : 75
    };

    logger.info(`Consultation requested by user ${userId} with doctor ${doctorId}`);

    res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully',
      consultation: consultationRequest
    });
  } catch (error) {
    logger.error('Request consultation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting consultation'
    });
  }
});

// @route   GET /api/communication/consultations
// @desc    Get user's consultation history
// @access  Private
router.get('/consultations', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Mock consultation history
    const mockConsultations = [
      {
        id: 'consultation_1',
        doctorName: 'Dr. Sarah Johnson',
        specialty: 'General Medicine',
        type: 'video',
        status: 'completed',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        duration: 25,
        reason: 'Follow-up on recent symptoms',
        notes: 'Patient is recovering well. Continue current medication.'
      },
      {
        id: 'consultation_2',
        doctorName: 'Dr. Michael Chen',
        specialty: 'Dermatology',
        type: 'chat',
        status: 'scheduled',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000),
        duration: 15,
        reason: 'Skin condition evaluation',
        notes: null
      }
    ];

    let filteredConsultations = mockConsultations;
    if (status) {
      filteredConsultations = filteredConsultations.filter(c => c.status === status);
    }

    res.json({
      success: true,
      consultations: filteredConsultations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredConsultations.length,
        pages: Math.ceil(filteredConsultations.length / limit)
      }
    });
  } catch (error) {
    logger.error('Get consultations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving consultations'
    });
  }
});

// @route   POST /api/communication/emergency
// @desc    Send emergency alert
// @access  Private
router.post('/emergency', [
  auth,
  body('location').optional().isObject(),
  body('symptoms').isArray({ min: 1 }),
  body('severity').isIn(['high', 'critical']),
  body('contactEmergencyServices').optional().isBoolean()
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

    const { location, symptoms, severity, contactEmergencyServices } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const emergencyAlert = {
      id: `emergency_${Date.now()}`,
      userId,
      userInfo: {
        name: `${user.firstName} ${user.lastName}`,
        age: user.dateOfBirth ? 
          Math.floor((new Date() - new Date(user.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 
          null,
        medicalHistory: user.medicalHistory,
        emergencyContact: user.emergencyContact
      },
      location,
      symptoms,
      severity,
      timestamp: new Date(),
      status: 'active',
      responders: []
    };

    // In production, this would:
    // 1. Alert nearby emergency responders
    // 2. Contact emergency services if requested
    // 3. Notify emergency contacts
    // 4. Send location to first responders

    logger.warn(`EMERGENCY ALERT from user ${userId}:`, emergencyAlert);

    // Mock emergency response
    setTimeout(() => {
      logger.info(`Emergency responders notified for alert ${emergencyAlert.id}`);
    }, 1000);

    res.status(201).json({
      success: true,
      message: 'Emergency alert sent successfully',
      alert: emergencyAlert,
      estimatedResponseTime: '5-10 minutes'
    });
  } catch (error) {
    logger.error('Emergency alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending emergency alert'
    });
  }
});

// @route   GET /api/communication/emergency-contacts
// @desc    Get emergency contacts and responders
// @access  Private
router.get('/emergency-contacts', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Mock nearby emergency responders
    const nearbyResponders = [
      {
        id: 'responder_1',
        name: 'City General Hospital',
        type: 'hospital',
        distance: '2.3 km',
        estimatedTime: '8 minutes',
        phone: '+1-555-0123',
        specialties: ['Emergency Medicine', 'Trauma Care']
      },
      {
        id: 'responder_2',
        name: 'Emergency Medical Services',
        type: 'ambulance',
        distance: '1.8 km',
        estimatedTime: '5 minutes',
        phone: '911',
        specialties: ['Emergency Response', 'Paramedic Care']
      }
    ];

    res.json({
      success: true,
      emergencyContact: user.emergencyContact,
      nearbyResponders,
      emergencyNumber: '911'
    });
  } catch (error) {
    logger.error('Get emergency contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving emergency contacts'
    });
  }
});

module.exports = router;