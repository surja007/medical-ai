# Smart Health Platform - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB
- Gemini API Key (from Google AI Studio)

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

### 2. Environment Configuration

```bash
# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Required Environment Variables:**
- `GEMINI_API_KEY`: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Random 32+ character string
- `ENCRYPTION_KEY`: Random 32 character string

### 3. Database Setup

```bash
# Start MongoDB (if using local installation)
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

### 4. Start Development Servers

```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run dev:backend  # Backend on http://localhost:5000
npm run dev:frontend # Frontend on http://localhost:3000
```

## Docker Deployment

### Development with Docker Compose

```bash
# Set required environment variables
export GEMINI_API_KEY="your-api-key"
export ENCRYPTION_KEY="your-32-char-key"

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Platform Features

### Core Functionality
- ✅ **AI Symptom Analysis** - Gemini 2.5 Pro powered
- ✅ **Image Diagnostics** - TensorFlow.js + Computer Vision
- ✅ **Wearable Integration** - Fitbit, Apple Health APIs
- ✅ **Virtual Assistant** - 24/7 AI health guidance
- ✅ **Doctor Communication** - WebRTC video calls
- ✅ **Emergency Alerts** - Automatic detection & response
- ✅ **Privacy & Security** - HIPAA compliant, AES-256 encryption

### Tech Stack
- **Frontend**: Next.js 14, React 18, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express.js, MongoDB, Socket.io
- **AI/ML**: Gemini 2.5 Pro, TensorFlow.js
- **Real-time**: WebRTC, Socket.io
- **Security**: JWT, OAuth 2.0, AES-256 encryption

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Health Analysis
- `POST /api/symptoms/analyze` - Analyze symptoms
- `POST /api/images/analyze` - Analyze health images
- `GET /api/symptoms/history` - Get analysis history

### Wearables
- `POST /api/wearables/connect` - Connect device
- `GET /api/wearables/health-data` - Get health metrics

### Communication
- `POST /api/communication/consultation` - Request doctor consultation
- `POST /api/communication/emergency` - Send emergency alert

## Security Features

### Data Protection
- End-to-end encryption for all health data
- HIPAA-compliant data handling
- Secure file upload with validation
- Rate limiting and DDoS protection

### Authentication
- JWT-based authentication
- OAuth 2.0 integration
- Multi-factor authentication support
- Session management

## Monitoring & Logging

### Health Checks
- `/health` - API health status
- Real-time system monitoring
- Error tracking and alerting

### Logging
- Structured logging with Winston
- Error tracking
- Performance monitoring

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check MongoDB status
   sudo systemctl status mongod
   
   # Restart MongoDB
   sudo systemctl restart mongod
   ```

2. **Gemini API Errors**
   - Verify API key is correct
   - Check API quota limits
   - Ensure proper network connectivity

3. **Port Conflicts**
   ```bash
   # Check port usage
   lsof -i :3000
   lsof -i :5000
   
   # Kill processes if needed
   kill -9 <PID>
   ```

### Development Tips

1. **Hot Reload Issues**
   - Clear Next.js cache: `rm -rf .next`
   - Restart development server

2. **Database Issues**
   - Clear MongoDB data: `db.dropDatabase()`
   - Check connection string format

3. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

- 📧 Email: support@healthai.com
- 📖 Documentation: [docs.healthai.com](https://docs.healthai.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discord: [Community Server](https://discord.gg/healthai)