// MongoDB Atlas Setup Script for Smart Health Platform
// Run this in MongoDB Compass or mongosh after connecting

// Switch to your database
use('smart_health_platform');

// Create collections with proper indexes
db.createCollection('users');
db.createCollection('symptomanalyses');
db.createCollection('healthimages');
db.createCollection('searchhistories');
db.createCollection('wearabledevices');
db.createCollection('healthdata');
db.createCollection('familygroups');
db.createCollection('familymembers');
db.createCollection('healthalerts');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.symptomanalyses.createIndex({ userId: 1 });
db.symptomanalyses.createIndex({ createdAt: 1 });

db.healthimages.createIndex({ userId: 1 });
db.healthimages.createIndex({ createdAt: 1 });

db.searchhistories.createIndex({ userId: 1 });
db.searchhistories.createIndex({ createdAt: 1 });

db.wearabledevices.createIndex({ userId: 1 });
db.wearabledevices.createIndex({ deviceId: 1 }, { unique: true });

db.healthdata.createIndex({ userId: 1 });
db.healthdata.createIndex({ deviceId: 1 });
db.healthdata.createIndex({ timestamp: 1 });

db.familygroups.createIndex({ createdBy: 1 });
db.familygroups.createIndex({ 'members.userId': 1 });

db.healthalerts.createIndex({ userId: 1 });
db.healthalerts.createIndex({ familyGroupId: 1 });
db.healthalerts.createIndex({ createdAt: 1 });

console.log('✅ Smart Health Platform database setup complete!');
console.log('📊 Collections created with proper indexes');
console.log('🔒 Ready for production deployment');