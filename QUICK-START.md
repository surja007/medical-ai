# 🚀 Quick Start Guide - Smart Health Platform

Your Gemini API key has been configured! Follow these steps to get the platform running in minutes.

## ⚡ Instant Setup (3 Steps)

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start MongoDB
```bash
# Option A: Using Docker (Recommended)
docker run -d -p 27017:27017 --name mongodb mongo:7.0

# Option B: Local MongoDB
mongod
```

### 3. Start the Platform
```bash
# Easy startup script
./start.sh

# Or manually
npm run dev
```

**🎉 That's it! Your platform is now running:**
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

---

## 🔧 Configuration Details

### Environment Variables (Already Set)
- ✅ **Gemini API Key**: `AIzaSyD8rAgyZ_ORf16z-jWgw1LX3TVbTJYC6GA`
- ✅ **JWT Secret**: Pre-configured for development
- ✅ **Encryption Key**: Pre-configured for development
- ✅ **Database**: MongoDB connection ready

### What's Included & Working
- ✅ **User Registration/Login** - Full authentication system
- ✅ **AI Symptom Analysis** - Powered by your Gemini API key
- ✅ **Health Image Analysis** - Upload and analyze medical images
- ✅ **Virtual Health Assistant** - 24/7 AI-powered guidance
- ✅ **Wearable Integration** - Mock data for testing
- ✅ **Doctor Communication** - Real-time messaging system
- ✅ **Emergency Alerts** - Emergency response system
- ✅ **Beautiful UI** - Modern, responsive design

---

## 🧪 Test the Platform

### 1. Create an Account
1. Go to http://localhost:3000
2. Click "Get Started" 
3. Fill out the registration form
4. Login with your credentials

### 2. Try AI Features
- **Symptom Analysis**: Describe symptoms and get AI-powered insights
- **Image Analysis**: Upload a health-related image for analysis
- **Virtual Assistant**: Chat with the AI health assistant

### 3. Explore Features
- **Dashboard**: View your health overview
- **Wearables**: Connect mock fitness devices
- **Consultations**: Request doctor appointments
- **Emergency**: Test emergency alert system

---

## 🐳 Docker Deployment (Alternative)

```bash
# Set environment variables
export GEMINI_API_KEY="AIzaSyD8rAgyZ_ORf16z-jWgw1LX3TVbTJYC6GA"
export ENCRYPTION_KEY="smart-health-32-char-encryption-key"

# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f
```

---

## 📱 API Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Register User
```bash
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

### Analyze Symptoms (with token)
```bash
curl -X POST http://localhost:5000/api/symptoms/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "symptoms": [
      {
        "name": "headache",
        "severity": 7,
        "duration": "2 days",
        "description": "Persistent throbbing pain"
      }
    ]
  }'
```

---

## 🔍 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill processes on ports 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

**MongoDB Connection Error**
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod           # Linux
```

**Gemini API Errors**
- ✅ API key is already configured
- Check network connectivity
- Verify API quota at [Google AI Studio](https://makersuite.google.com/)

**Build Errors**
```bash
# Clear caches and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
rm -rf frontend/.next
npm run install:all
```

---

## 🎯 Next Steps

### Production Deployment
1. **Update Environment Variables**
   - Change JWT_SECRET and ENCRYPTION_KEY
   - Use production MongoDB URI
   - Configure SMTP for email notifications

2. **Deploy to Render**
   - Connect GitHub repository
   - Set environment variables
   - Deploy backend and frontend services

3. **Add Real Integrations**
   - Fitbit API credentials
   - Apple Health integration
   - Twilio for SMS notifications
   - Stripe for payments

### Feature Extensions
- **Video Calling**: Implement WebRTC for doctor consultations
- **Push Notifications**: Add real-time alerts
- **Mobile App**: React Native version
- **Advanced AI**: Custom health models
- **Telemedicine**: Full consultation platform

---

## 📞 Support

- **Issues**: Check the logs in `backend/logs/`
- **API Docs**: Available at http://localhost:5000/api-docs (coming soon)
- **Database**: MongoDB Compass for GUI: `mongodb://localhost:27017`

**🎉 Enjoy building with your Smart Health Platform!**