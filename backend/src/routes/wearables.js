const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const WearableData = require('../models/WearableData');
const WearableService = require('../services/WearableService');
const logger = require('../utils/logger');
const axios = require('axios');

const router = express.Router();

// @route   POST /api/wearables/connect
// @desc    Connect a wearable device
// @access  Private
router.post('/connect', [
  auth,
  body('deviceType').isIn(['fitbit', 'apple_watch', 'garmin', 'samsung_health', 'custom']),
  body('accessToken').optional().trim(),
  body('refreshToken').optional().trim()
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

    const { deviceType, accessToken, refreshToken, deviceId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    // Check if device already connected
    const existingDevice = user.wearableDevices.find(
      device => device.deviceType === deviceType && device.deviceId === deviceId
    );

    if (existingDevice) {
      // Update existing device
      existingDevice.accessToken = accessToken;
      existingDevice.refreshToken = refreshToken;
      existingDevice.isActive = true;
    } else {
      // Add new device
      user.wearableDevices.push({
        deviceType,
        deviceId: deviceId || `${deviceType}_${Date.now()}`,
        accessToken,
        refreshToken,
        isActive: true
      });
    }

    await user.save();

    logger.info(`Wearable device connected for user ${userId}: ${deviceType}`);

    res.json({
      success: true,
      message: 'Device connected successfully',
      devices: user.wearableDevices
    });
  } catch (error) {
    logger.error('Connect wearable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error connecting device'
    });
  }
});

// @route   GET /api/wearables/devices
// @desc    Get connected wearable devices
// @access  Private
router.get('/devices', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.json({
      success: true,
      devices: user.wearableDevices || []
    });
  } catch (error) {
    logger.error('Get wearable devices error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving devices'
    });
  }
});

// @route   POST /api/wearables/data
// @desc    Submit wearable device data
// @access  Private
router.post('/data', [
  auth,
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('deviceType').isIn(['fitbit', 'apple_watch', 'garmin', 'samsung_health', 'xiaomi', 'huawei', 'custom']),
  body('dataType').isIn(['heart_rate', 'blood_pressure', 'steps', 'sleep', 'location', 'fall_detection', 'emergency_button', 'battery_level', 'temperature', 'oxygen_saturation']),
  body('data').isObject().withMessage('Data object is required')
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

    const { deviceId, deviceType, dataType, data } = req.body;
    const userId = req.user.id;

    // Process the wearable data through the service
    const wearableData = await WearableService.processWearableData(
      userId,
      deviceId,
      deviceType,
      dataType,
      data
    );

    res.json({
      success: true,
      message: 'Wearable data processed successfully',
      dataId: wearableData._id,
      alertsGenerated: wearableData.processing.alertsGenerated?.length || 0
    });
  } catch (error) {
    logger.error('Submit wearable data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing wearable data'
    });
  }
});

// @route   GET /api/wearables/health-data
// @desc    Get health data from wearable devices
// @access  Private
router.get('/health-data', auth, async (req, res) => {
  try {
    const { startDate, endDate, dataType, limit = 100 } = req.query;
    const userId = req.user.id;

    let query = { user: userId };
    
    if (dataType) {
      query.dataType = dataType;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const wearableData = await WearableData.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Get latest readings for dashboard
    const latestReadings = {};
    const dataTypes = ['heart_rate', 'blood_pressure', 'steps', 'sleep', 'temperature', 'oxygen_saturation'];
    
    for (const type of dataTypes) {
      const latest = await WearableData.getLatestForUser(userId, type, 1);
      if (latest.length > 0) {
        latestReadings[type] = {
          value: latest[0].getValue(),
          timestamp: latest[0].timestamp,
          deviceType: latest[0].deviceType
        };
      }
    }

    // Get connected devices
    const user = await User.findById(userId);
    const connectedDevices = user.wearableDevices?.filter(d => d.isActive) || [];

    res.json({
      success: true,
      data: wearableData,
      latestReadings,
      connectedDevices: connectedDevices.length,
      devices: connectedDevices,
      totalRecords: wearableData.length
    });
  } catch (error) {
    logger.error('Get health data error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving health data'
    });
  }
});

// @route   GET /api/wearables/analytics
// @desc    Get health data analytics and trends
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { dataType = 'heart_rate', days = 7 } = req.query;
    const userId = req.user.id;

    const analytics = await WearableData.getDailyAggregates(userId, dataType, parseInt(days));

    // Calculate trends
    const trends = {
      trend: 'stable',
      changePercent: 0,
      insights: []
    };

    if (analytics.length >= 2) {
      const recent = analytics[analytics.length - 1];
      const previous = analytics[analytics.length - 2];
      
      if (recent.avgValue && previous.avgValue) {
        const change = ((recent.avgValue - previous.avgValue) / previous.avgValue) * 100;
        trends.changePercent = Math.round(change * 100) / 100;
        
        if (Math.abs(change) > 5) {
          trends.trend = change > 0 ? 'increasing' : 'decreasing';
        }
      }
    }

    res.json({
      success: true,
      analytics,
      trends,
      dataType,
      period: `${days} days`
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving analytics'
    });
  }
});

// @route   DELETE /api/wearables/devices/:deviceId
// @desc    Disconnect a wearable device
// @access  Private
router.delete('/devices/:deviceId', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const user = await User.findById(req.user.id);

    user.wearableDevices = user.wearableDevices.filter(
      device => device.deviceId !== deviceId
    );

    await user.save();

    logger.info(`Wearable device disconnected for user ${req.user.id}: ${deviceId}`);

    res.json({
      success: true,
      message: 'Device disconnected successfully',
      devices: user.wearableDevices
    });
  } catch (error) {
    logger.error('Disconnect wearable error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting device'
    });
  }
});

// Helper functions to generate mock data
function generateMockTimeSeriesData(type, startDate, endDate) {
  const data = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    let value;
    switch (type) {
      case 'heartRate':
        value = 65 + Math.random() * 20;
        break;
      case 'steps':
        value = 5000 + Math.random() * 8000;
        break;
      case 'calories':
        value = 1800 + Math.random() * 600;
        break;
      default:
        value = Math.random() * 100;
    }
    
    data.push({
      date: new Date(d).toISOString().split('T')[0],
      value: Math.round(value)
    });
  }
  
  return data;
}

function generateMockSleepData(startDate, endDate) {
  const data = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    data.push({
      date: new Date(d).toISOString().split('T')[0],
      totalHours: 6.5 + Math.random() * 2,
      deepSleep: 1.5 + Math.random() * 1,
      remSleep: 1.2 + Math.random() * 1,
      lightSleep: 3 + Math.random() * 2,
      bedtime: '23:00',
      wakeTime: '07:30'
    });
  }
  
  return data;
}

function generateMockBPData(startDate, endDate) {
  const data = [];
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate) : new Date();
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    data.push({
      date: new Date(d).toISOString().split('T')[0],
      systolic: 115 + Math.random() * 15,
      diastolic: 75 + Math.random() * 10
    });
  }
  
  return data;
}

module.exports = router;