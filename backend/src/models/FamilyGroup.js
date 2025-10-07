const mongoose = require('mongoose');

const familyGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Family group name is required'],
        trim: true,
        maxlength: [100, 'Family group name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['admin', 'parent', 'guardian', 'child', 'spouse', 'sibling', 'grandparent', 'other'],
            default: 'other'
        },
        permissions: {
            viewHealthData: { type: Boolean, default: false },
            receiveAlerts: { type: Boolean, default: true },
            manageDevices: { type: Boolean, default: false },
            emergencyContact: { type: Boolean, default: false }
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        }
    }],
    invitations: [{
        email: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ['parent', 'guardian', 'child', 'spouse', 'sibling', 'grandparent', 'other'],
            default: 'other'
        },
        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        invitedAt: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'expired'],
            default: 'pending'
        }
    }],
    settings: {
        alertThresholds: {
            heartRate: {
                min: { type: Number, default: 50 },
                max: { type: Number, default: 120 }
            },
            bloodPressure: {
                systolicMax: { type: Number, default: 140 },
                diastolicMax: { type: Number, default: 90 }
            },
            steps: {
                dailyGoal: { type: Number, default: 8000 }
            },
            sleep: {
                minHours: { type: Number, default: 6 }
            }
        },
        emergencyContacts: [{
            name: String,
            phoneNumber: String,
            relationship: String,
            priority: { type: Number, default: 1 }
        }],
        notifications: {
            realTimeAlerts: { type: Boolean, default: true },
            dailySummary: { type: Boolean, default: true },
            weeklyReport: { type: Boolean, default: false },
            emergencyAlerts: { type: Boolean, default: true }
        }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
familyGroupSchema.index({ admin: 1 });
familyGroupSchema.index({ 'members.user': 1 });
familyGroupSchema.index({ 'invitations.email': 1 });

// Virtual for active members count
familyGroupSchema.virtual('activeMembersCount').get(function () {
    return this.members.filter(member => member.isActive).length;
});

// Method to check if user is member
familyGroupSchema.methods.isMember = function (userId) {
    return this.members.some(member =>
        member.user.toString() === userId.toString() && member.isActive
    );
};

// Method to get member permissions
familyGroupSchema.methods.getMemberPermissions = function (userId) {
    const member = this.members.find(member =>
        member.user.toString() === userId.toString() && member.isActive
    );
    return member ? member.permissions : null;
};

// Method to check if user can view another member's health data
familyGroupSchema.methods.canViewHealthData = function (viewerId, targetUserId) {
    const viewer = this.members.find(member =>
        member.user.toString() === viewerId.toString() && member.isActive
    );

    if (!viewer) return false;

    // Admin can view all
    if (this.admin.toString() === viewerId.toString()) return true;

    // Check permissions
    return viewer.permissions.viewHealthData;
};

familyGroupSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('FamilyGroup', familyGroupSchema);