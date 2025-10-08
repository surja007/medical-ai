const WearableData = require('../models/WearableData');
const User = require('../models/User');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * Service for handling Bluetooth-connected wearable devices
 * Processes real-time data from Web Bluetooth API connections
 */
class BluetoothWearableService {
  constructor() {
    this.activeConnections = new Map(); // Track active Bluetooth connections
    this.dataBuffer = new Map(); // Buffer for batch processing
    this.processingInterval = null;
    
    // Start batch processing
    this.startBatchProcessing();
  }

  /**
   * Register a new Bluetooth device connection
   */
  async registerBluetoothDevice(userId, deviceInfo) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if device already exists
      const existingDevice = user.wearableDevices.find(
        device => device.deviceId === deviceInfo.deviceId
      );

      const deviceData = {
        deviceType: deviceInfo.deviceType || 'bluetooth_generic',
        deviceId: deviceInfo.deviceId,
        name: deviceInfo.name || 'Bluetooth Device',
        manufacturer: deviceInfo.manufacturer || 'Unknown',
        connectionType: 'bluetooth',
        capabilities: deviceInfo.capabilities || [],
        isActive: true,
        lastConnected: new Date(),
        metadata: {
          bluetoothId: deviceInfo.bluetoothId,
          services: deviceInfo.services || [],
          characteristics: deviceInfo.characteristics || []
        }
      };

      if (existingDevice) {
        // Update existing device
        Object.assign(existingDevice, deviceData);
      } else {
        // Add new device
        user.wearableDevices.push(deviceData);
      }

      await user.save();

      // Track active connection
      this.activeConnections.set(deviceInfo.deviceId, {
        userId,
        deviceInfo: deviceData,
        connectedAt: new Date(),
        lastActivity: new Date()
      });

      logger.info(`Bluetooth device registered: ${deviceInfo.name} for user ${userId}`);

      return {
        success: true,
        device: deviceData
      };

    } catch (error) {
      logger.error('Error registering Bluetooth device:', error);
      throw error;
    }
  }

  /**
   * Process incoming Bluetooth data
   */
  async processBluetoothData(userId, deviceId, rawData) {
    try {
      // Validate connection
      const connection = this.activeConnections.get(deviceId);
      if (!connection || connection.userId !== userId) {
        throw new Error('Invalid device connection');
      }

      // Update last activity
      connection.lastActivity = new Date();

      // Parse and validate data
      const parsedData = this.parseBluetoothData(rawData);
      if (!parsedData) {
        logger.warn(`Invalid Bluetooth data from device ${deviceId}`);
        return null;
      }

      // Create wearable data entry
      const wearableData = new WearableData({
        user: userId,
        deviceId: deviceId,
        deviceType: connection.deviceInfo.deviceType,
        dataType: parsedData.type,
        timestamp: parsedData.timestamp || new Date(),
        data: this.formatDataForStorage(parsedData),
        quality: {
          score: this.calculateDataQuality(parsedData),
          validated: true,
          validatedBy: 'bluetooth_service'
        },
        sync: {
          source: 'bluetooth',
          syncedAt: new Date(),
          batchId: this.generateBatchId()
        }
      });

      // Add to buffer for batch processing
      this.addToBuffer(userId, wearableData);

      // Process immediately for critical data
      if (this.isCriticalData(parsedData)) {
        await this.processCriticalData(wearableData);
      }

      logger.debug(`Bluetooth data buffered: ${parsedData.type} from ${deviceId}`);

      return {
        success: true,
        dataId: wearableData._id,
        type: parsedData.type,
        processed: this.isCriticalData(parsedData)
      };

    } catch (error) {
      logger.error('Error processing Bluetooth data:', error);
      throw error;
    }
  }

  /**
   * Parse raw Bluetooth data into structured format
   */
  parseBluetoothData(rawData) {
    try {
      // Handle different data formats
      if (typeof rawData === 'string') {
        rawData = JSON.parse(rawData);
      }

      if (!rawData.type) {
        return null;
      }

      const parsed = {
        type: rawData.type,
        timestamp: rawData.timestamp ? new Date(rawData.timestamp) : new Date(),
        confidence: rawData.confidence || 0.9,
        rawData: rawData
      };

      // Parse specific data types
      switch (rawData.type) {
        case 'heart_rate':
          parsed.heartRate = {
            bpm: rawData.bpm || rawData.heartRate,
            confidence: rawData.confidence || 0.9,
            context: rawData.context || 'real_time'
          };
          break;

        case 'battery':
          parsed.battery = {
            level: rawData.level || rawData.batteryLevel,
            isCharging: rawData.isCharging || false,
            estimatedLife: rawData.estimatedLife
          };
          break;

        case 'steps':
          parsed.steps = {
            count: rawData.count || rawData.steps,
            distance: rawData.distance,
            calories: rawData.calories
          };
          break;

        case 'temperature':
          parsed.temperature = {
            celsius: rawData.celsius || rawData.temperature,
            fahrenheit: rawData.fahrenheit || (rawData.celsius * 9/5 + 32),
            location: rawData.location || 'wrist'
          };
          break;

        case 'oxygen_saturation':
          parsed.oxygenSaturation = {
            percentage: rawData.percentage || rawData.spo2,
            confidence: rawData.confidence || 0.8
          };
          break;

        case 'fall_detection':
          parsed.emergency = {
            type: 'fall',
            confidence: rawData.confidence || 0.7,
            autoDetected: true,
            location: rawData.location
          };
          break;

        default:
          // Generic data handling
          parsed.generic = rawData;
      }

      return parsed;

    } catch (error) {
      logger.error('Error parsing Bluetooth data:', error);
      return null;
    }
  }

  /**
   * Format parsed data for database storage
   */
  formatDataForStorage(parsedData) {
    const data = {};

    switch (parsedData.type) {
      case 'heart_rate':
        data.heartRate = parsedData.heartRate;
        break;

      case 'battery':
        data.device = {
          batteryLevel: parsedData.battery.level,
          isCharging: parsedData.battery.isCharging,
          lastSync: new Date()
        };
        break;

      case 'steps':
        data.steps = parsedData.steps;
        break;

      case 'temperature':
        data.biometrics = {
          temperature: parsedData.temperature.celsius
        };
        break;

      case 'oxygen_saturation':
        data.biometrics = {
          oxygenSaturation: parsedData.oxygenSaturation.percentage
        };
        break;

      case 'fall_detection':
        data.emergency = parsedData.emergency;
        break;

      default:
        data.rawData = parsedData.rawData;
    }

    return data;
  }

  /**
   * Calculate data quality score
   */
  calculateDataQuality(parsedData) {
    let score = 0.8; // Base score for Bluetooth data

    // Adjust based on confidence
    if (parsedData.confidence) {
      score = Math.min(score + (parsedData.confidence - 0.5) * 0.4, 1.0);
    }

    // Adjust based on data completeness
    const requiredFields = this.getRequiredFields(parsedData.type);
    const presentFields = Object.keys(parsedData).filter(key => 
      requiredFields.includes(key) && parsedData[key] !== null
    );
    
    const completeness = presentFields.length / requiredFields.length;
    score *= completeness;

    return Math.max(score, 0.1); // Minimum quality score
  }

  /**
   * Get required fields for data type
   */
  getRequiredFields(dataType) {
    const fieldMap = {
      'heart_rate': ['heartRate', 'timestamp'],
      'battery': ['battery', 'timestamp'],
      'steps': ['steps', 'timestamp'],
      'temperature': ['temperature', 'timestamp'],
      'oxygen_saturation': ['oxygenSaturation', 'timestamp'],
      'fall_detection': ['emergency', 'timestamp']
    };

    return fieldMap[dataType] || ['timestamp'];
  }

  /**
   * Check if data is critical and needs immediate processing
   */
  isCriticalData(parsedData) {
    const criticalTypes = ['fall_detection', 'emergency_button'];
    
    if (criticalTypes.includes(parsedData.type)) {
      return true;
    }

    // Check for critical heart rate values
    if (parsedData.type === 'heart_rate' && parsedData.heartRate) {
      const bpm = parsedData.heartRate.bpm;
      if (bpm < 40 || bpm > 180) {
        return true;
      }
    }

    // Check for critical temperature
    if (parsedData.type === 'temperature' && parsedData.temperature) {
      const temp = parsedData.temperature.celsius;
      if (temp < 35 || temp > 40) {
        return true;
      }
    }

    return false;
  }

  /**
   * Process critical data immediately
   */
  async processCriticalData(wearableData) {
    try {
      // Save immediately
      await wearableData.save();

      // Generate health alert if needed
      const alertGenerated = await this.generateHealthAlert(wearableData);
      
      if (alertGenerated) {
        wearableData.processing.alertsGenerated = [alertGenerated._id];
        await wearableData.save();
      }

      logger.warn(`Critical health data processed: ${wearableData.dataType} for user ${wearableData.user}`);

    } catch (error) {
      logger.error('Error processing critical data:', error);
    }
  }

  /**
   * Generate health alert for critical data
   */
  async generateHealthAlert(wearableData) {
    // This would integrate with your existing health alert system
    // For now, just log the critical event
    logger.warn(`HEALTH ALERT: Critical ${wearableData.dataType} detected for user ${wearableData.user}`);
    
    // Return mock alert ID
    return { _id: 'alert_' + Date.now() };
  }

  /**
   * Add data to processing buffer
   */
  addToBuffer(userId, wearableData) {
    if (!this.dataBuffer.has(userId)) {
      this.dataBuffer.set(userId, []);
    }
    
    this.dataBuffer.get(userId).push(wearableData);
  }

  /**
   * Start batch processing of buffered data
   */
  startBatchProcessing() {
    this.processingInterval = setInterval(async () => {
      await this.processBatchedData();
    }, 30000); // Process every 30 seconds
  }

  /**
   * Process all buffered data
   */
  async processBatchedData() {
    for (const [userId, dataArray] of this.dataBuffer.entries()) {
      if (dataArray.length === 0) continue;

      try {
        // Batch insert to database
        await WearableData.insertMany(dataArray);
        
        logger.info(`Processed ${dataArray.length} Bluetooth data entries for user ${userId}`);
        
        // Clear buffer
        this.dataBuffer.set(userId, []);

      } catch (error) {
        logger.error(`Error processing batched data for user ${userId}:`, error);
      }
    }
  }

  /**
   * Handle device disconnection
   */
  async handleDeviceDisconnection(deviceId) {
    const connection = this.activeConnections.get(deviceId);
    if (connection) {
      try {
        // Update device status in database
        const user = await User.findById(connection.userId);
        const device = user.wearableDevices.find(d => d.deviceId === deviceId);
        
        if (device) {
          device.isActive = false;
          device.lastDisconnected = new Date();
          await user.save();
        }

        // Remove from active connections
        this.activeConnections.delete(deviceId);

        logger.info(`Bluetooth device disconnected: ${deviceId}`);

      } catch (error) {
        logger.error('Error handling device disconnection:', error);
      }
    }
  }

  /**
   * Get active Bluetooth connections for user
   */
  getUserConnections(userId) {
    const userConnections = [];
    
    for (const [deviceId, connection] of this.activeConnections.entries()) {
      if (connection.userId === userId) {
        userConnections.push({
          deviceId,
          deviceInfo: connection.deviceInfo,
          connectedAt: connection.connectedAt,
          lastActivity: connection.lastActivity
        });
      }
    }

    return userConnections;
  }

  /**
   * Generate batch ID for data grouping
   */
  generateBatchId() {
    return `bt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup inactive connections
   */
  cleanupInactiveConnections() {
    const now = new Date();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [deviceId, connection] of this.activeConnections.entries()) {
      if (now - connection.lastActivity > timeout) {
        this.handleDeviceDisconnection(deviceId);
      }
    }
  }

  /**
   * Stop the service and cleanup
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Process any remaining buffered data
    this.processBatchedData();
  }
}

module.exports = new BluetoothWearableService();