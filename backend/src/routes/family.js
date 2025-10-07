const express = require('express');
const { body, validationResult } = require('express-validator');
const { auth } = require('../middleware/auth');
const FamilyGroup = require('../models/FamilyGroup');
const HealthAlert = require('../models/HealthAlert');
const User = require('../models/User');
const WearableService = require('../services/WearableService');
const NotificationService = require('../services/NotificationService');
const logger = require('../utils/logger');

const router = express.Router();

// @route   POST /api/family/groups
// @desc    Create a new family group
// @access  Private
router.post('/groups', [
  auth,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Group name is required'),
  body('description').optional().isLength({ max: 500 }).withMessage('Description too long')
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

    const { name, description } = req.body;
    const userId = req.user.id;

    const familyGroup = new FamilyGroup({
      name,
      description,
      admin: userId,
      members: [{
        user: userId,
        role: 'admin',
        permissions: {
          viewHealthData: true,
          receiveAlerts: true,
          manageDevices: true,
          emergencyContact: true
        }
      }]
    });

    await familyGroup.save();

    logger.info(`Family group created by user ${userId}: ${name}`);

    res.status(201).json({
      success: true,
      message: 'Family group created successfully',
      familyGroup
    });
  } catch (error) {
    logger.error('Create family group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating family group'
    });
  }
});

// @route   GET /api/family/groups
// @desc    Get user's family groups
// @access  Private
router.get('/groups', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const familyGroups = await FamilyGroup.find({
      'members.user': userId,
      'members.isActive': true,
      isActive: true
    })
    .populate('admin', 'firstName lastName email')
    .populate('members.user', 'firstName lastName email')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      familyGroups
    });
  } catch (error) {
    logger.error('Get family groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving family groups'
    });
  }
});

// @route   GET /api/family/groups/:groupId
// @desc    Get specific family group details
// @access  Private
router.get('/groups/:groupId', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const familyGroup = await FamilyGroup.findById(groupId)
      .populate('admin', 'firstName lastName email')
      .populate('members.user', 'firstName lastName email dateOfBirth gender')
      .populate('invitations.invitedBy', 'firstName lastName');

    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check if user is a member
    if (!familyGroup.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      familyGroup
    });
  } catch (error) {
    logger.error('Get family group error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving family group'
    });
  }
});

// @route   POST /api/family/groups/:groupId/invite
// @desc    Invite member to family group
// @access  Private
router.post('/groups/:groupId/invite', [
  auth,
  body('email').isEmail().withMessage('Valid email is required'),
  body('role').isIn(['parent', 'guardian', 'child', 'spouse', 'sibling', 'grandparent', 'other'])
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

    const { groupId } = req.params;
    const { email, role } = req.body;
    const userId = req.user.id;

    const familyGroup = await FamilyGroup.findById(groupId);
    
    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check if user can invite (admin or has permissions)
    if (familyGroup.admin.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can invite members'
      });
    }

    // Check if already invited or member
    const existingInvitation = familyGroup.invitations.find(
      inv => inv.email === email && inv.status === 'pending'
    );

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'User already invited'
      });
    }

    // Check if user is already a member
    const existingUser = await User.findOne({ email });
    if (existingUser && familyGroup.isMember(existingUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }

    // Add invitation
    familyGroup.invitations.push({
      email,
      role,
      invitedBy: userId
    });

    await familyGroup.save();

    // Send invitation email (mock)
    logger.info(`Family invitation sent to ${email} for group ${familyGroup.name}`);

    res.json({
      success: true,
      message: 'Invitation sent successfully'
    });
  } catch (error) {
    logger.error('Invite member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending invitation'
    });
  }
});

// @route   POST /api/family/invitations/:invitationId/respond
// @desc    Respond to family group invitation
// @access  Private
router.post('/invitations/:invitationId/respond', [
  auth,
  body('response').isIn(['accept', 'decline'])
], async (req, res) => {
  try {
    const { invitationId } = req.params;
    const { response } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);

    const familyGroup = await FamilyGroup.findOne({
      'invitations._id': invitationId
    });

    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Invitation not found'
      });
    }

    const invitation = familyGroup.invitations.id(invitationId);
    
    if (invitation.email !== user.email) {
      return res.status(403).json({
        success: false,
        message: 'This invitation is not for you'
      });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Invitation already responded to'
      });
    }

    invitation.status = response === 'accept' ? 'accepted' : 'declined';

    if (response === 'accept') {
      // Add user as member
      familyGroup.members.push({
        user: userId,
        role: invitation.role,
        permissions: {
          viewHealthData: true,
          receiveAlerts: true,
          manageDevices: false,
          emergencyContact: true
        }
      });
    }

    await familyGroup.save();

    logger.info(`User ${userId} ${response}ed invitation to family group ${familyGroup.name}`);

    res.json({
      success: true,
      message: `Invitation ${response}ed successfully`,
      familyGroup: response === 'accept' ? familyGroup : null
    });
  } catch (error) {
    logger.error('Respond to invitation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to invitation'
    });
  }
});

// @route   GET /api/family/groups/:groupId/health-overview
// @desc    Get family health overview
// @access  Private
router.get('/groups/:groupId/health-overview', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { days = 7 } = req.query;
    const userId = req.user.id;

    const familyGroup = await FamilyGroup.findById(groupId);
    
    if (!familyGroup || !familyGroup.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const overview = await WearableService.getFamilyHealthOverview(groupId, parseInt(days));

    res.json({
      success: true,
      overview
    });
  } catch (error) {
    logger.error('Get family health overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving family health overview'
    });
  }
});

// @route   GET /api/family/groups/:groupId/alerts
// @desc    Get family alerts
// @access  Private
router.get('/groups/:groupId/alerts', auth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { limit = 50, severity, resolved } = req.query;
    const userId = req.user.id;

    const familyGroup = await FamilyGroup.findById(groupId);
    
    if (!familyGroup || !familyGroup.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let query = { familyGroup: groupId };
    
    if (severity) {
      query.severity = severity;
    }
    
    if (resolved !== undefined) {
      query.isResolved = resolved === 'true';
    }

    const alerts = await HealthAlert.find(query)
      .populate('user', 'firstName lastName')
      .populate('resolvedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      alerts
    });
  } catch (error) {
    logger.error('Get family alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving family alerts'
    });
  }
});

// @route   PUT /api/family/alerts/:alertId/resolve
// @desc    Resolve a health alert
// @access  Private
router.put('/alerts/:alertId/resolve', [
  auth,
  body('resolutionNotes').optional().isLength({ max: 500 })
], async (req, res) => {
  try {
    const { alertId } = req.params;
    const { resolutionNotes } = req.body;
    const userId = req.user.id;

    const alert = await HealthAlert.findById(alertId);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    // Check if user can resolve this alert
    const familyGroup = await FamilyGroup.findById(alert.familyGroup);
    if (!familyGroup || !familyGroup.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    alert.isResolved = true;
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = resolutionNotes;

    await alert.save();

    logger.info(`Alert ${alertId} resolved by user ${userId}`);

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    logger.error('Resolve alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resolving alert'
    });
  }
});

// @route   PUT /api/family/groups/:groupId/settings
// @desc    Update family group settings
// @access  Private
router.put('/groups/:groupId/settings', [
  auth,
  body('alertThresholds').optional().isObject(),
  body('notifications').optional().isObject()
], async (req, res) => {
  try {
    const { groupId } = req.params;
    const { alertThresholds, notifications, emergencyContacts } = req.body;
    const userId = req.user.id;

    const familyGroup = await FamilyGroup.findById(groupId);
    
    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check if user is admin
    if (familyGroup.admin.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can update settings'
      });
    }

    // Update settings
    if (alertThresholds) {
      familyGroup.settings.alertThresholds = {
        ...familyGroup.settings.alertThresholds,
        ...alertThresholds
      };
    }

    if (notifications) {
      familyGroup.settings.notifications = {
        ...familyGroup.settings.notifications,
        ...notifications
      };
    }

    if (emergencyContacts) {
      familyGroup.settings.emergencyContacts = emergencyContacts;
    }

    await familyGroup.save();

    logger.info(`Family group settings updated by user ${userId}`);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: familyGroup.settings
    });
  } catch (error) {
    logger.error('Update family settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating settings'
    });
  }
});

// @route   PUT /api/family/groups/:groupId/members/:memberId/permissions
// @desc    Update member permissions
// @access  Private
router.put('/groups/:groupId/members/:memberId/permissions', [
  auth,
  body('permissions').isObject()
], async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { permissions } = req.body;
    const userId = req.user.id;

    const familyGroup = await FamilyGroup.findById(groupId);
    
    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check if user is admin
    if (familyGroup.admin.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only group admin can update permissions'
      });
    }

    const member = familyGroup.members.id(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    member.permissions = {
      ...member.permissions,
      ...permissions
    };

    await familyGroup.save();

    logger.info(`Member permissions updated by user ${userId}`);

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      member
    });
  } catch (error) {
    logger.error('Update member permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating permissions'
    });
  }
});

// @route   DELETE /api/family/groups/:groupId/members/:memberId
// @desc    Remove member from family group
// @access  Private
router.delete('/groups/:groupId/members/:memberId', auth, async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user.id;

    const familyGroup = await FamilyGroup.findById(groupId);
    
    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    const member = familyGroup.members.id(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check permissions (admin or removing self)
    if (familyGroup.admin.toString() !== userId && member.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot remove admin
    if (member.user.toString() === familyGroup.admin.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove group admin'
      });
    }

    member.isActive = false;
    await familyGroup.save();

    logger.info(`Member removed from family group by user ${userId}`);

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    logger.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing member'
    });
  }
});

module.exports = router;