# 🔐 Authentication & Session Management Guide

## Overview

The Smart Health Platform now implements a robust authentication system with MongoDB-based session management, providing enhanced security and user experience.

## 🏗️ Architecture

### Session-Based Authentication
- **Access Tokens**: Short-lived JWT tokens (15 minutes)
- **Refresh Tokens**: Long-lived tokens (7 days) stored in MongoDB
- **Session Storage**: All login sessions tracked in MongoDB
- **Device Tracking**: Device information and location tracking
- **Automatic Cleanup**: Expired sessions automatically removed

### Security Features
- ✅ **JWT + Session Hybrid**: Best of both worlds
- ✅ **Automatic Token Refresh**: Seamless user experience
- ✅ **Device Fingerprinting**: Track login devices
- ✅ **Session Management**: View and manage active sessions
- ✅ **Multi-Device Support**: Login from multiple devices
- ✅ **Secure Logout**: Proper session invalidation

## 📊 Database Schema

### Session Model
```javascript
{
  userId: ObjectId,           // Reference to User
  sessionToken: String,       // Unique session identifier
  refreshToken: String,       // Refresh token for token renewal
  deviceInfo: {
    userAgent: String,        // Browser user agent
    ipAddress: String,        // Client IP address
    deviceType: String,       // mobile/tablet/desktop
    browser: String,          // Chrome/Firefox/Safari
    os: String               // Windows/macOS/Linux/iOS/Android
  },
  isActive: Boolean,          // Session status
  lastActivity: Date,         // Last activity timestamp
  expiresAt: Date,           // Session expiration (TTL index)
  loginMethod: String,        // email/google/apple/facebook
  location: {
    country: String,          // User's country
    city: String,            // User's city
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  createdAt: Date,           // Session creation time
  updatedAt: Date            // Last update time
}
```

## 🔄 Authentication Flow

### 1. Login Process
```
1. User submits credentials
2. Server validates credentials
3. Create session in MongoDB
4. Generate access token (15min) + refresh token (7 days)
5. Store tokens in secure cookies
6. Return user data + tokens
```

### 2. Token Refresh Flow
```
1. Access token expires (15 minutes)
2. Frontend automatically uses refresh token
3. Server validates refresh token against MongoDB session
4. Generate new access token
5. Update session last activity
6. Return new access token
```

### 3. Logout Process
```
1. User clicks logout
2. Invalidate session in MongoDB
3. Clear cookies on client
4. Redirect to login page
```

## 🛠️ API Endpoints

### Authentication
```bash
# Register new user
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "phoneNumber": "+1234567890",
  "emergencyContact": {
    "name": "Jane Doe",
    "phoneNumber": "+1234567891",
    "relationship": "spouse"
  }
}

# Login user
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Refresh access token
POST /api/auth/refresh
{
  "refreshToken": "refresh_token_here"
}

# Get current user
GET /api/auth/me
Authorization: Bearer access_token_here

# Logout current session
POST /api/auth/logout
Authorization: Bearer access_token_here

# Logout all sessions
POST /api/auth/logout-all
Authorization: Bearer access_token_here

# Get active sessions
GET /api/auth/sessions
Authorization: Bearer access_token_here
```

## 💻 Frontend Implementation

### Using the Auth Context
```tsx
import { useAuth } from '@/contexts/AuthContext'

function LoginComponent() {
  const { login, isLoading, isAuthenticated } = useAuth()
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password)
      // User is now logged in
    } catch (error) {
      // Handle login error
    }
  }
}
```

### Session Management Component
```tsx
import { SessionManager } from '@/components/auth/SessionManager'

function SettingsPage() {
  return (
    <div>
      <h1>Account Settings</h1>
      <SessionManager />
    </div>
  )
}
```

### Automatic Token Refresh
The API client automatically handles token refresh:
```typescript
// Automatic token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Automatically refresh token and retry request
    }
  }
)
```

## 🔧 Configuration

### Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Session Configuration
SESSION_CLEANUP_INTERVAL=3600000  # 1 hour in milliseconds
SESSION_MAX_AGE=604800000         # 7 days in milliseconds
```

### MongoDB Indexes
```javascript
// Automatic indexes for performance
db.sessions.createIndex({ "userId": 1, "isActive": 1 })
db.sessions.createIndex({ "sessionToken": 1, "isActive": 1 })
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

## 🧹 Session Cleanup

### Automatic Cleanup Jobs
- **Hourly**: Remove expired sessions
- **Every 6 hours**: Remove sessions inactive for 30+ days
- **On startup**: Initial cleanup of expired sessions

### Manual Cleanup
```bash
# Run cleanup via API (admin only)
POST /api/admin/cleanup-sessions
Authorization: Bearer admin_token
```

## 🔒 Security Best Practices

### Implemented Security Measures
1. **Short-lived Access Tokens**: 15-minute expiration
2. **Secure Cookies**: HttpOnly, Secure, SameSite
3. **Device Fingerprinting**: Track suspicious logins
4. **Session Validation**: Every request validates session
5. **Automatic Cleanup**: Remove expired sessions
6. **Rate Limiting**: Prevent brute force attacks

### Additional Recommendations
1. **Enable HTTPS**: Always use SSL in production
2. **Monitor Sessions**: Alert on suspicious activity
3. **Implement 2FA**: Add two-factor authentication
4. **IP Whitelisting**: For admin accounts
5. **Session Limits**: Limit concurrent sessions per user

## 📱 Mobile App Integration

### React Native Setup
```typescript
// Store tokens in secure storage
import AsyncStorage from '@react-native-async-storage/async-storage'

const storeTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.setItem('accessToken', accessToken)
  await AsyncStorage.setItem('refreshToken', refreshToken)
}
```

## 🚨 Troubleshooting

### Common Issues

**Token Refresh Loops**
```bash
# Check refresh token expiration
db.sessions.find({ refreshToken: "token_here" })
```

**Session Not Found**
```bash
# Verify session exists and is active
db.sessions.find({ sessionToken: "session_here", isActive: true })
```

**High Session Count**
```bash
# Check for cleanup job issues
db.sessions.countDocuments({ isActive: true })
```

### Debug Commands
```bash
# View active sessions for user
db.sessions.find({ userId: ObjectId("user_id"), isActive: true })

# Check expired sessions
db.sessions.find({ expiresAt: { $lt: new Date() } })

# View session cleanup logs
tail -f backend/logs/combined.log | grep "session cleanup"
```

## 📊 Monitoring & Analytics

### Session Metrics
- Active sessions count
- Average session duration
- Device type distribution
- Geographic distribution
- Login method usage

### Health Checks
```bash
# Check session service health
GET /api/health/sessions

# Response
{
  "activeSessions": 1250,
  "expiredSessions": 45,
  "cleanupLastRun": "2024-01-15T10:30:00Z",
  "status": "healthy"
}
```

## 🎯 Next Steps

### Planned Enhancements
1. **Two-Factor Authentication**: SMS/Email/TOTP
2. **Social Login**: Google, Apple, Facebook
3. **Biometric Authentication**: Fingerprint, Face ID
4. **Advanced Analytics**: Login patterns, security alerts
5. **Session Sharing**: Family account management

This authentication system provides enterprise-grade security while maintaining excellent user experience. All sessions are properly tracked, managed, and secured in MongoDB.