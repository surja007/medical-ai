# Smart Health Diagnostics and Assistance Platform

A comprehensive AI-powered health platform that provides intelligent symptom analysis, medical image diagnostics, healthcare provider search, and virtual health assistance using Google's Gemini 2.5 Pro AI.

## 🚀 Features

### Core Health Services
- 🔍 **AI Symptom Analysis**: Advanced symptom interpretation using Gemini 2.5 Pro with fallback analysis
- 📸 **Medical Image Analysis**: AI-powered analysis of health-related images with professional review recommendations
- 🤖 **Virtual Health Assistant**: 24/7 AI-powered health guidance with medical disclaimers and emergency protocols
- 🏥 **Healthcare Provider Search**: Free location-based doctor and clinic finder using OpenStreetMap
- 📋 **Search History**: Comprehensive tracking and analysis of user health searches

### 🏃‍♂️ Wearable Device Integration
- ⌚ **Multi-Device Support**: Fitbit, Apple Watch, Garmin, Samsung Health, Xiaomi, Huawei, and custom devices
- 📊 **Real-Time Monitoring**: Heart rate, blood pressure, steps, sleep, temperature, oxygen saturation
- 🚨 **Smart Alerts**: Automatic health threshold monitoring with intelligent alert generation
- 🔋 **Device Management**: Battery monitoring, sync status, and firmware tracking
- 📈 **Health Analytics**: Trend analysis, daily aggregates, and personalized insights

### 👨‍👩‍👧‍👦 Family Health Monitoring
- 👪 **Family Groups**: Create and manage family health monitoring groups
- 🔗 **Member Connections**: Invite family members with customizable roles and permissions
- 🚨 **Family Alerts**: Real-time health alerts distributed to family members based on severity
- 📱 **Multi-Channel Notifications**: Push notifications, SMS, email, and emergency voice calls
- 🏠 **Centralized Dashboard**: Monitor entire family's health status from one interface
- 🚑 **Emergency Protocols**: Automatic escalation and emergency contact systems

### User Experience
- 👤 **User Authentication**: Secure JWT-based authentication with profile management
- 📱 **Responsive Design**: Modern UI built with Next.js 14, React 18, and TailwindCSS
- 🔄 **Real-time Communication**: Socket.io integration for live updates
- 📊 **Health Dashboard**: Personalized health overview and analytics
- 🚨 **Emergency Protocols**: Built-in emergency detection and response guidance

### Security & Privacy
- 🔒 **Data Encryption**: AES-256 encryption for sensitive health data
- 🛡️ **Security Headers**: Helmet.js protection with rate limiting
- 📝 **Session Management**: Secure session handling with automatic cleanup
- 🔐 **Environment Security**: Secure API key management and validation

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + Radix UI Components
- **State Management**: React Context + Zustand
- **HTTP Client**: Axios with React Query
- **Real-time**: Socket.io Client
- **Forms**: React Hook Form + Zod validation

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs hashing
- **File Upload**: Multer with Sharp image processing
- **Logging**: Winston with file rotation
- **Validation**: Express Validator
- **Real-time**: Socket.io
- **Jobs**: Node-cron for cleanup tasks

### AI & External Services
- **AI Model**: Google Gemini 2.5 Pro API
- **Image Processing**: Sharp for optimization
- **Maps**: OpenStreetMap + Nominatim (free APIs)
- **Healthcare Search**: Custom free healthcare provider service

### DevOps & Deployment
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose with MongoDB and Redis
- **Environment**: Production-ready with health checks
- **Monitoring**: Comprehensive logging and error tracking

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (with npm)
- **MongoDB** (local or Docker)
- **Gemini API Key** (get from [Google AI Studio](https://makersuite.google.com/))

### ⚡ Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd smart-health-platform
   npm run install:all
   ```

2. **Setup Environment**
   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   
   # Add your Gemini API key to backend/.env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. **Start MongoDB**
   ```bash
   # Option A: Docker (Recommended)
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Option B: Local MongoDB
   mongod
   ```

4. **Launch Platform**
   ```bash
   # Quick start script
   ./start.sh
   
   # Or manually
   npm run dev
   ```

**🎉 Access Your Platform:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

### 🐳 Docker Deployment

```bash
# Set required environment variables
export GEMINI_API_KEY="your_api_key_here"
export ENCRYPTION_KEY="your-32-character-encryption-key"

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
smart-health-platform/
├── frontend/                 # Next.js React application
│   ├── app/                 # App router pages
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # User dashboard
│   │   ├── symptoms/       # Symptom analysis
│   │   ├── images/         # Image analysis
│   │   └── assistant/      # AI assistant chat
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Base UI components (Radix)
│   │   ├── auth/          # Authentication components
│   │   ├── landing/       # Landing page sections
│   │   └── layout/        # Layout components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   └── lib/               # Utilities and API client
├── backend/                # Node.js Express API
│   └── src/
│       ├── config/        # Database configuration
│       ├── models/        # MongoDB schemas
│       │   ├── User.js
│       │   ├── SymptomAnalysis.js
│       │   ├── HealthImage.js
│       │   └── SearchHistory.js
│       ├── routes/        # API endpoints
│       │   ├── auth.js
│       │   ├── symptoms.js
│       │   ├── images.js
│       │   ├── assistant.js
│       │   └── searchHistory.js
│       ├── services/      # Business logic
│       │   ├── GeminiService.js
│       │   ├── SearchHistoryService.js
│       │   └── freeHealthcareService.js
│       ├── middleware/    # Express middleware
│       ├── utils/         # Utilities (encryption, logging)
│       ├── sockets/       # Socket.io handlers
│       └── jobs/          # Background jobs
└── docker-compose.yml     # Multi-service deployment
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Health Services
- `POST /api/symptoms/analyze` - AI symptom analysis
- `POST /api/images/analyze` - Medical image analysis
- `POST /api/assistant/chat` - Virtual assistant chat
- `GET /api/search-history` - Get user search history

### Wearable Device Management
- `POST /api/wearables/connect` - Connect wearable device
- `POST /api/wearables/data` - Submit device health data
- `GET /api/wearables/health-data` - Get health data and readings
- `GET /api/wearables/analytics` - Get health trends and analytics
- `GET /api/wearables/devices` - Get connected devices
- `DELETE /api/wearables/devices/:deviceId` - Disconnect device

### Family Health Monitoring
- `POST /api/family/groups` - Create family group
- `GET /api/family/groups` - Get user's family groups
- `POST /api/family/groups/:groupId/invite` - Invite family member
- `POST /api/family/invitations/:invitationId/respond` - Accept/decline invitation
- `GET /api/family/groups/:groupId/health-overview` - Get family health overview
- `GET /api/family/groups/:groupId/alerts` - Get family health alerts
- `PUT /api/family/alerts/:alertId/resolve` - Resolve health alert
- `PUT /api/family/groups/:groupId/settings` - Update group settings

### Healthcare Providers
- `GET /api/communication/doctors/nearby` - Find nearby doctors
- `GET /api/communication/hospitals/nearby` - Find nearby hospitals

## 🔒 Security & Privacy

### Data Protection
- **AES-256 Encryption**: All sensitive health data encrypted at rest
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation with express-validator
- **Rate Limiting**: API rate limiting to prevent abuse
- **Security Headers**: Helmet.js for security headers

### Privacy Compliance
- **Data Minimization**: Only collect necessary health information
- **User Control**: Users can delete their data and search history
- **Medical Disclaimers**: All AI responses include medical disclaimers
- **Professional Recommendations**: Always recommend consulting healthcare providers

### Emergency Protocols
- **Emergency Detection**: AI identifies potential emergency symptoms
- **Immediate Guidance**: Clear instructions for emergency situations
- **Professional Referral**: Automatic recommendations for urgent care


## 🧪 Testing the Platform

### 1. User Registration & Authentication
```bash
# Register a new user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### 2. Connect Wearable Device
```bash
# Connect a fitness tracker
curl -X POST http://localhost:5000/api/wearables/connect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "deviceType": "fitbit",
    "deviceId": "fitbit_12345",
    "accessToken": "your_device_token"
  }'
```

### 3. Submit Health Data
```bash
# Submit heart rate data
curl -X POST http://localhost:5000/api/wearables/data \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "deviceId": "fitbit_12345",
    "deviceType": "fitbit",
    "dataType": "heart_rate",
    "data": {
      "heartRate": 85,
      "timestamp": "2024-01-15T10:30:00Z",
      "context": "resting"
    }
  }'
```

### 4. Create Family Group
```bash
# Create a family monitoring group
curl -X POST http://localhost:5000/api/family/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Smith Family",
    "description": "Family health monitoring group"
  }'
```

### 5. AI Symptom Analysis
```bash
# Analyze symptoms (requires JWT token)
curl -X POST http://localhost:5000/api/symptoms/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "symptoms": [{
      "name": "headache",
      "severity": 7,
      "duration": "2 days",
      "description": "Persistent throbbing pain"
    }]
  }'
```

### 6. Healthcare Provider Search
```bash
# Find nearby doctors
curl "http://localhost:5000/api/communication/doctors/nearby?lat=40.7128&lng=-74.0060&radius=10"
```

## 🎯 Key Features Explained

### AI-Powered Symptom Analysis
- **Gemini 2.5 Pro Integration**: Uses Google's latest AI model for medical analysis
- **Fallback System**: Provides intelligent analysis even when AI service is unavailable
- **Structured Output**: Returns JSON with conditions, urgency levels, and recommendations
- **Safety First**: Always includes medical disclaimers and professional consultation advice

### Medical Image Analysis
- **Multi-format Support**: Handles JPEG, PNG, and other common image formats
- **Context-Aware**: Considers symptoms and body parts for better analysis
- **Quality Assessment**: Evaluates image quality and provides feedback
- **Professional Review**: Always recommends professional medical review for concerning findings

### Wearable Device Integration
- **Universal Compatibility**: Supports major fitness trackers and smartwatches
- **Real-Time Processing**: Instant health data processing with intelligent analysis
- **Smart Thresholds**: Customizable health thresholds with automatic alert generation
- **Family Sync**: Automatic sharing of health data with family members based on permissions
- **Emergency Detection**: Advanced fall detection and emergency button monitoring

### Family Health Monitoring System
- **Multi-Generational Support**: Monitor health across all family members from children to elderly
- **Role-Based Permissions**: Customizable access levels for different family relationships
- **Intelligent Alerting**: Context-aware alerts sent via appropriate channels (push, SMS, call)
- **Emergency Escalation**: Automatic escalation protocols for critical health events
- **Privacy Controls**: Granular privacy settings while maintaining emergency access

### Healthcare Provider Search
- **Free Service**: Uses OpenStreetMap and Nominatim APIs (no API keys required)
- **Location-Based**: Finds doctors, hospitals, and clinics near user location
- **Comprehensive Data**: Returns contact information, specialties, and ratings
- **Emergency Services**: Includes emergency hospitals and urgent care centers

### Search History & Analytics
- **Comprehensive Tracking**: Stores all user health searches and analyses
- **Privacy Focused**: Users control their data with deletion options
- **Trend Analysis**: Identifies patterns in user health concerns
- **Export Capability**: Users can export their health data

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/smart-health-platform

# Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
ENCRYPTION_KEY=your-32-character-encryption-key

# AI Service
GEMINI_API_KEY=your-gemini-api-key

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

#### Frontend (.env.local)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# App Configuration  
NEXT_PUBLIC_APP_NAME=HealthAI
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature Flags
NEXT_PUBLIC_ENABLE_WEARABLES=true
NEXT_PUBLIC_ENABLE_VIDEO_CALLS=true
```

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

**Port Already in Use**
```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**Gemini API Issues**
- Verify API key at [Google AI Studio](https://makersuite.google.com/)
- Check API quota and billing
- Platform includes fallback analysis for API failures

**Build Errors**
```bash
# Clear all caches and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
rm -rf frontend/.next
npm run install:all
```

## 📈 Performance & Monitoring

### Logging
- **Winston Logger**: Comprehensive logging with file rotation
- **Error Tracking**: Detailed error logs in `backend/logs/`
- **Request Logging**: All API requests logged with IP and timestamp

### Health Monitoring
- **Health Check Endpoint**: `/health` returns server status and uptime
- **Database Monitoring**: Connection status and query performance
- **AI Service Monitoring**: Tracks Gemini API response times and failures

### Background Jobs
- **Session Cleanup**: Automatic cleanup of expired sessions
- **Log Rotation**: Prevents log files from growing too large
- **Database Optimization**: Regular cleanup of old search history

## 🚀 Production Deployment

### Docker Production Setup
```bash
# Production environment variables
export NODE_ENV=production
export GEMINI_API_KEY="your-production-api-key"
export JWT_SECRET="your-production-jwt-secret"
export ENCRYPTION_KEY="your-production-encryption-key"
export MONGODB_URI="your-production-mongodb-uri"

# Deploy with Docker Compose
docker-compose -f docker-compose.yml up -d
```

### Security Checklist for Production
- [ ] Change default JWT_SECRET and ENCRYPTION_KEY
- [ ] Use production MongoDB with authentication
- [ ] Enable HTTPS with SSL certificates
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup strategy for user data

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- **Frontend**: TypeScript, ESLint, Prettier
- **Backend**: JavaScript ES6+, JSDoc comments
- **Testing**: Jest for unit tests, Supertest for API tests
- **Documentation**: Update README for new features

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **API Documentation**: Available at `http://localhost:5000/api-docs` (coming soon)
- **Health Check**: Monitor status at `http://localhost:5000/health`

## ⚠️ Medical Disclaimer

This platform is for educational and informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified healthcare providers with any questions regarding medical conditions. Never disregard professional medical advice or delay seeking it because of information provided by this platform.

---

**Built with ❤️ for better healthcare accessibility**
