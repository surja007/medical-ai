const WearableData = require('../models/WearableData');
const HealthAlert = require('../models/HealthAlert');
const FamilyGroup = require('../models/FamilyGroup');
const User = require('../models/User');
const logger = require('../utils/logger');
const NotificationService = require('./NotificationService');

class WearableService {
  constructor() {
    this.alertThresholds = {
      heartRate: {
        min: 50,
        max: 120,
        criticalMin: 40,
        criticalMax: 150
      },
      bloodPressure: {
        systolicMax: 140,
        diastolicMax: 90,
        systolicCritical: 180,
        diastolicCritical: 110
      },
      oxygenSaturation: {
        min: 95,
        critical: 90
      },
      temperature: {
        min: 36.1,
        max: 37.2,
        criticalMin: 35.0,
        criticalMax: 39.0
      }
    };
  }

  // Process incoming wearable data
  async processWearableData(userId, deviceId, deviceType, dataType, rawData) {
    try {
      // Create wearable data entry
      const wearableData = new WearableData({
        user: userId,
        deviceId,
        deviceType,
        dataType,
        timestamp: rawData.timestamp || new Date(),
        data: this.normalizeData(dataType, rawData),
        quality: this.assessDataQuality(dataType, rawData),
        sync: {
          source: 'device',
          syncedAt: new Date()
        }
      });

      await wearableData.save();

      // Process for alerts
      await this.checkForAlerts(wearableData);

      // Update family monitoring
      await this.updateFamilyMonitoring(userId, wearableData);

      logger.info(`Processed wearable data for user ${userId}: ${dataType}`);
      
      return wearableData;
    } catch (error) {
      logger.error('Error processing wearable data:', error);
      throw error;
    }
  }

  // Normalize different device data formats
  normalizeData(dataType, rawData) {
    const normalized = {};

    switch (dataType) {
      case 'heart_rate':
        normalized.heartRate = {
          bpm: rawData.heartRate || rawData.bpm || rawData.value,
          confidence: rawData.confidence || 1.0,
          context: rawData.context || 'unknown'
        };
        break;

      case 'blood_pressure':
        normalized.bloodPressure = {
          systolic: rawData.systolic || rawData.sys,
          diastolic: rawData.diastolic || rawData.dia,
          pulse: rawData.pulse || rawData.heartRate
        };
        break;

      case 'steps':
        normalized.steps = {
          count: rawData.steps || rawData.count || rawData.value,
          distance: rawData.distance,
          calories: rawData.calories,
          activeMinutes: rawData.activeMinutes
        };
        break;

      case 'sleep':
        normalized.sleep = {
          duration: rawData.duration || rawData.totalMinutes,
          efficiency: rawData.efficiency,
          stages: {
            deep: rawData.deepSleep || rawData.stages?.deep,
            light: rawData.lightSleep || rawData.stages?.light,
            rem: rawData.remSleep || rawData.stages?.rem,
            awake: rawData.awakeTime || rawData.stages?.awake
          },
          bedtime: rawData.bedtime,
          wakeTime: rawData.wakeTime,
          quality: rawData.quality
        };
        break;

      case 'location':
        normalized.location = {
          latitude: rawData.latitude || rawData.lat,
          longitude: rawData.longitude || rawData.lng,
          accuracy: rawData.accuracy,
          address: rawData.address,
          isHome: rawData.isHome
        };
        break;

      case 'fall_detection':
        normalized.emergency = {
          type: 'fall',
          confidence: rawData.confidence || 0.8,
          autoDetected: true,
          userConfirmed: rawData.confirmed || false
        };
        break;

      case 'emergency_button':
        normalized.emergency = {
          type: 'button_press',
          confidence: 1.0,
          autoDetected: false,
          userConfirmed: true
        };
        break;

      case 'battery_level':
        normalized.device = {
          batteryLevel: rawData.battery || rawData.level || rawData.percentage,
          isCharging: rawData.charging || false
        };
        break;

      case 'oxygen_saturation':
        normalized.biometrics = {
          oxygenSaturation: rawData.spo2 || rawData.oxygen || rawData.value
        };
        break;

      case 'temperature':
        normalized.biometrics = {
          temperature: rawData.temperature || rawData.temp || rawData.value
        };
        break;

      default:
        normalized.rawData = rawData;
    }

    return normalized;
  }

  // Assess data quality
  assessDataQuality(dataType, rawData) {
    const quality = {
      score: 1.0,
      issues: [],
      validated: false
    };

    // Check for missing required fields
    switch (dataType) {
      case 'heart_rate':
        if (!rawData.heartRate && !rawData.bpm && !rawData.value) {
          quality.score -= 0.5;
          quality.issues.push('Missing heart rate value');
        }
        break;

      case 'blood_pressure':
        if (!rawData.systolic || !rawData.diastolic) {
          quality.score -= 0.5;
          quality.issues.push('Missing blood pressure values');
        }
        break;
    }

    // Check for unrealistic values
    if (dataType === 'heart_rate') {
      const bpm = rawData.heartRate || rawData.bpm || rawData.value;
      if (bpm < 30 || bpm > 220) {
        quality.score -= 0.3;
        quality.issues.push('Unrealistic heart rate value');
      }
    }

    return quality;
  }

  // Check for health alerts
  async checkForAlerts(wearableData) {
    try {
      const alerts = [];
      const { user, dataType, data } = wearableData;

      // Get user's family groups for alert distribution
      const familyGroups = await FamilyGroup.find({
        'members.user': user,
        'members.isActive': true
      });

      switch (dataType) {
        case 'heart_rate':
          alerts.push(...await this.checkHeartRateAlerts(wearableData, familyGroups));
          break;

        case 'blood_pressure':
          alerts.push(...await this.checkBloodPressureAlerts(wearableData, familyGroups));
          break;

        case 'fall_detection':
          alerts.push(...await this.checkFallAlerts(wearableData, familyGroups));
          break;

        case 'emergency_button':
          alerts.push(...await this.checkEmergencyAlerts(wearableData, familyGroups));
          break;

        case 'battery_level':
          alerts.push(...await this.checkBatteryAlerts(wearableData, familyGroups));
          break;

        case 'oxygen_saturation':
          alerts.push(...await this.checkOxygenAlerts(wearableData, familyGroups));
          break;

        case 'temperature':
          alerts.push(...await this.checkTemperatureAlerts(wearableData, familyGroups));
          break;
      }

      // Save and send alerts
      for (const alert of alerts) {
        await alert.save();
        await this.sendAlert(alert);
      }

      return alerts;
    } catch (error) {
      logger.error('Error checking for alerts:', error);
      throw error;
    }
  }

  // Heart rate alert checking
  async checkHeartRateAlerts(wearableData, familyGroups) {
    const alerts = [];
    const heartRate = wearableData.data.heartRate?.bpm;
    
    if (!heartRate) return alerts;

    const { min, max, criticalMin, criticalMax } = this.alertThresholds.heartRate;

    if (heartRate <= criticalMin || heartRate >= criticalMax) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: heartRate <= criticalMin ? 'heart_rate_low' : 'heart_rate_high',
        severity: 'emergency',
        title: `Critical Heart Rate Alert`,
        message: `Heart rate is ${heartRate} BPM, which is ${heartRate <= criticalMin ? 'critically low' : 'critically high'}. Immediate medical attention may be required.`,
        healthData: {
          heartRate,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'emergency')
      }));
    } else if (heartRate <= min || heartRate >= max) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: heartRate <= min ? 'heart_rate_low' : 'heart_rate_high',
        severity: 'high',
        title: `Heart Rate Alert`,
        message: `Heart rate is ${heartRate} BPM, which is ${heartRate <= min ? 'below normal' : 'above normal'} range.`,
        healthData: {
          heartRate,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'high')
      }));
    }

    return alerts;
  }

  // Blood pressure alert checking
  async checkBloodPressureAlerts(wearableData, familyGroups) {
    const alerts = [];
    const bp = wearableData.data.bloodPressure;
    
    if (!bp?.systolic || !bp?.diastolic) return alerts;

    const { systolicMax, diastolicMax, systolicCritical, diastolicCritical } = this.alertThresholds.bloodPressure;

    if (bp.systolic >= systolicCritical || bp.diastolic >= diastolicCritical) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'blood_pressure_high',
        severity: 'emergency',
        title: `Critical Blood Pressure Alert`,
        message: `Blood pressure is ${bp.systolic}/${bp.diastolic} mmHg, which is critically high. Seek immediate medical attention.`,
        healthData: {
          bloodPressure: bp,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'emergency')
      }));
    } else if (bp.systolic >= systolicMax || bp.diastolic >= diastolicMax) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'blood_pressure_high',
        severity: 'high',
        title: `High Blood Pressure Alert`,
        message: `Blood pressure is ${bp.systolic}/${bp.diastolic} mmHg, which is elevated.`,
        healthData: {
          bloodPressure: bp,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'high')
      }));
    }

    return alerts;
  }

  // Fall detection alerts
  async checkFallAlerts(wearableData, familyGroups) {
    const alerts = [];
    const emergency = wearableData.data.emergency;
    
    if (emergency?.type === 'fall') {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'fall_detection',
        severity: 'emergency',
        title: `Fall Detected`,
        message: `A fall has been detected. Confidence: ${Math.round(emergency.confidence * 100)}%. Please check on the person immediately.`,
        healthData: {
          location: wearableData.data.location,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType,
          rawData: emergency
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'emergency'),
        actions: [
          { type: 'call_emergency', description: 'Call emergency services if needed' },
          { type: 'check_vitals', description: 'Check if person is responsive' }
        ]
      }));
    }

    return alerts;
  }

  // Emergency button alerts
  async checkEmergencyAlerts(wearableData, familyGroups) {
    const alerts = [];
    
    alerts.push(new HealthAlert({
      user: wearableData.user,
      familyGroup: familyGroups[0]?._id,
      alertType: 'emergency_button',
      severity: 'emergency',
      title: `Emergency Button Pressed`,
      message: `Emergency button has been pressed. Immediate assistance may be required.`,
      healthData: {
        location: wearableData.data.location,
        timestamp: wearableData.timestamp,
        deviceType: wearableData.deviceType
      },
      recipients: await this.getFamilyAlertRecipients(familyGroups, 'emergency'),
      actions: [
        { type: 'call_emergency', description: 'Call emergency services' },
        { type: 'contact_doctor', description: 'Contact primary care physician' }
      ]
    }));

    return alerts;
  }

  // Battery level alerts
  async checkBatteryAlerts(wearableData, familyGroups) {
    const alerts = [];
    const battery = wearableData.data.device?.batteryLevel;
    
    if (battery !== undefined && battery <= 10) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'battery_low',
        severity: 'medium',
        title: `Low Battery Alert`,
        message: `Wearable device battery is at ${battery}%. Please charge the device to ensure continuous monitoring.`,
        healthData: {
          deviceBattery: battery,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'medium')
      }));
    }

    return alerts;
  }

  // Oxygen saturation alerts
  async checkOxygenAlerts(wearableData, familyGroups) {
    const alerts = [];
    const oxygen = wearableData.data.biometrics?.oxygenSaturation;
    
    if (!oxygen) return alerts;

    const { min, critical } = this.alertThresholds.oxygenSaturation;

    if (oxygen <= critical) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'oxygen_saturation_low',
        severity: 'emergency',
        title: `Critical Oxygen Level Alert`,
        message: `Oxygen saturation is ${oxygen}%, which is critically low. Seek immediate medical attention.`,
        healthData: {
          oxygenSaturation: oxygen,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'emergency')
      }));
    } else if (oxygen <= min) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'oxygen_saturation_low',
        severity: 'high',
        title: `Low Oxygen Level Alert`,
        message: `Oxygen saturation is ${oxygen}%, which is below normal range.`,
        healthData: {
          oxygenSaturation: oxygen,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'high')
      }));
    }

    return alerts;
  }

  // Temperature alerts
  async checkTemperatureAlerts(wearableData, familyGroups) {
    const alerts = [];
    const temp = wearableData.data.biometrics?.temperature;
    
    if (!temp) return alerts;

    const { min, max, criticalMin, criticalMax } = this.alertThresholds.temperature;

    if (temp <= criticalMin || temp >= criticalMax) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'temperature_abnormal',
        severity: 'emergency',
        title: `Critical Temperature Alert`,
        message: `Body temperature is ${temp}°C, which is ${temp <= criticalMin ? 'critically low' : 'critically high'}.`,
        healthData: {
          temperature: temp,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'emergency')
      }));
    } else if (temp <= min || temp >= max) {
      alerts.push(new HealthAlert({
        user: wearableData.user,
        familyGroup: familyGroups[0]?._id,
        alertType: 'temperature_abnormal',
        severity: 'medium',
        title: `Temperature Alert`,
        message: `Body temperature is ${temp}°C, which is ${temp <= min ? 'below' : 'above'} normal range.`,
        healthData: {
          temperature: temp,
          timestamp: wearableData.timestamp,
          deviceType: wearableData.deviceType
        },
        recipients: await this.getFamilyAlertRecipients(familyGroups, 'medium')
      }));
    }

    return alerts;
  }

  // Get family members who should receive alerts
  async getFamilyAlertRecipients(familyGroups, severity) {
    const recipients = [];

    for (const group of familyGroups) {
      for (const member of group.members) {
        if (member.isActive && member.permissions.receiveAlerts) {
          // Determine notification method based on severity
          let notificationMethod = 'push';
          if (severity === 'emergency') {
            notificationMethod = 'call';
          } else if (severity === 'high') {
            notificationMethod = 'sms';
          }

          recipients.push({
            user: member.user,
            notificationMethod,
            status: 'pending'
          });
        }
      }
    }

    return recipients;
  }

  // Send alert notifications
  async sendAlert(alert) {
    try {
      for (const recipient of alert.recipients) {
        await NotificationService.sendHealthAlert(
          recipient.user,
          alert,
          recipient.notificationMethod
        );
        
        recipient.sentAt = new Date();
        recipient.status = 'sent';
      }

      await alert.save();
      logger.info(`Alert sent to ${alert.recipients.length} recipients`);
    } catch (error) {
      logger.error('Error sending alert:', error);
    }
  }

  // Update family monitoring dashboard
  async updateFamilyMonitoring(userId, wearableData) {
    try {
      // This would update real-time family monitoring dashboards
      // Implementation would depend on your real-time system (Socket.io, etc.)
      
      const familyGroups = await FamilyGroup.find({
        'members.user': userId,
        'members.isActive': true
      });

      for (const group of familyGroups) {
        // Emit real-time update to family members
        // io.to(`family_${group._id}`).emit('health_update', {
        //   userId,
        //   dataType: wearableData.dataType,
        //   timestamp: wearableData.timestamp,
        //   summary: this.getDataSummary(wearableData)
        // });
      }
    } catch (error) {
      logger.error('Error updating family monitoring:', error);
    }
  }

  // Get summary of wearable data for family dashboard
  getDataSummary(wearableData) {
    const { dataType, data } = wearableData;
    
    switch (dataType) {
      case 'heart_rate':
        return {
          type: 'Heart Rate',
          value: `${data.heartRate?.bpm} BPM`,
          status: this.getHeartRateStatus(data.heartRate?.bpm)
        };
      
      case 'blood_pressure':
        return {
          type: 'Blood Pressure',
          value: `${data.bloodPressure?.systolic}/${data.bloodPressure?.diastolic} mmHg`,
          status: this.getBloodPressureStatus(data.bloodPressure)
        };
      
      case 'steps':
        return {
          type: 'Steps',
          value: `${data.steps?.count} steps`,
          status: 'normal'
        };
      
      default:
        return {
          type: dataType,
          value: 'Updated',
          status: 'normal'
        };
    }
  }

  // Helper methods for status determination
  getHeartRateStatus(bpm) {
    if (!bpm) return 'unknown';
    const { min, max, criticalMin, criticalMax } = this.alertThresholds.heartRate;
    
    if (bpm <= criticalMin || bpm >= criticalMax) return 'critical';
    if (bpm <= min || bpm >= max) return 'warning';
    return 'normal';
  }

  getBloodPressureStatus(bp) {
    if (!bp?.systolic || !bp?.diastolic) return 'unknown';
    const { systolicMax, diastolicMax, systolicCritical, diastolicCritical } = this.alertThresholds.bloodPressure;
    
    if (bp.systolic >= systolicCritical || bp.diastolic >= diastolicCritical) return 'critical';
    if (bp.systolic >= systolicMax || bp.diastolic >= diastolicMax) return 'warning';
    return 'normal';
  }

  // Get family health overview
  async getFamilyHealthOverview(familyGroupId, days = 7) {
    try {
      const familyGroup = await FamilyGroup.findById(familyGroupId)
        .populate('members.user', 'firstName lastName');

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const overview = {
        familyGroup: familyGroup.name,
        members: [],
        alerts: await HealthAlert.getFamilyAlerts(familyGroupId, 20),
        summary: {
          totalMembers: familyGroup.activeMembersCount,
          activeDevices: 0,
          recentAlerts: 0,
          criticalAlerts: 0
        }
      };

      // Get data for each family member
      for (const member of familyGroup.members) {
        if (!member.isActive) continue;

        const memberData = await this.getMemberHealthSummary(
          member.user._id,
          startDate,
          endDate
        );

        overview.members.push({
          user: member.user,
          role: member.role,
          ...memberData
        });

        overview.summary.activeDevices += memberData.activeDevices;
      }

      // Count recent alerts
      overview.summary.recentAlerts = overview.alerts.length;
      overview.summary.criticalAlerts = overview.alerts.filter(
        alert => alert.severity === 'critical' || alert.severity === 'emergency'
      ).length;

      return overview;
    } catch (error) {
      logger.error('Error getting family health overview:', error);
      throw error;
    }
  }

  // Get individual member health summary
  async getMemberHealthSummary(userId, startDate, endDate) {
    try {
      const user = await User.findById(userId);
      
      // Get latest readings
      const latestHeartRate = await WearableData.getLatestForUser(userId, 'heart_rate', 1);
      const latestBloodPressure = await WearableData.getLatestForUser(userId, 'blood_pressure', 1);
      const latestSteps = await WearableData.getLatestForUser(userId, 'steps', 1);
      
      // Get recent alerts
      const recentAlerts = await HealthAlert.find({
        user: userId,
        createdAt: { $gte: startDate }
      }).sort({ createdAt: -1 }).limit(5);

      return {
        activeDevices: user.wearableDevices?.filter(d => d.isActive).length || 0,
        latestReadings: {
          heartRate: latestHeartRate[0]?.data.heartRate?.bpm,
          bloodPressure: latestBloodPressure[0]?.data.bloodPressure,
          steps: latestSteps[0]?.data.steps?.count
        },
        recentAlerts: recentAlerts.length,
        lastActivity: latestHeartRate[0]?.timestamp || latestSteps[0]?.timestamp,
        status: this.getMemberStatus(recentAlerts, latestHeartRate[0], latestBloodPressure[0])
      };
    } catch (error) {
      logger.error('Error getting member health summary:', error);
      return {
        activeDevices: 0,
        latestReadings: {},
        recentAlerts: 0,
        status: 'unknown'
      };
    }
  }

  getMemberStatus(alerts, heartRateData, bpData) {
    // Check for critical alerts
    const criticalAlerts = alerts.filter(
      alert => alert.severity === 'critical' || alert.severity === 'emergency'
    );
    
    if (criticalAlerts.length > 0) return 'critical';
    
    // Check recent readings
    if (heartRateData) {
      const status = this.getHeartRateStatus(heartRateData.data.heartRate?.bpm);
      if (status === 'critical' || status === 'warning') return status;
    }
    
    if (bpData) {
      const status = this.getBloodPressureStatus(bpData.data.bloodPressure);
      if (status === 'critical' || status === 'warning') return status;
    }
    
    return 'normal';
  }
}

module.exports = new WearableService();