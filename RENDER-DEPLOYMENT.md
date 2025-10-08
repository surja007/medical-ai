# Render Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account**: Set up a free MongoDB cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. **Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/)
3. **GitHub Repository**: Your code should be in a GitHub repository

## Deployment Steps

### 1. Set Up MongoDB Atlas

1. Create a MongoDB Atlas account
2. Create a new cluster (free tier is sufficient for testing)
3. Create a database user with read/write permissions
4. Whitelist all IP addresses (0.0.0.0/0) for Render access
5. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/smart_health_platform`

### 2. Deploy Backend on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `smart-health-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

5. Set Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRE=7d
   GEMINI_API_KEY=your_gemini_api_key_here
   ENCRYPTION_KEY=your-32-character-encryption-key-here
   FRONTEND_URL=https://your-frontend-app.onrender.com
   RATE_LIMIT_WINDOW=15
   RATE_LIMIT_MAX=100
   ```

### 3. Deploy Frontend on Render

1. Click "New +" → "Web Service"
2. Connect same repository
3. Configure:
   - **Name**: `smart-health-frontend`
   - **Environment**: `Node`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Start Command**: `cd frontend && npm start`

4. Set Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-app.onrender.com
   NEXT_PUBLIC_SOCKET_URL=https://your-backend-app.onrender.com
   NEXT_PUBLIC_APP_NAME=HealthAI
   NEXT_PUBLIC_ENABLE_WEARABLES=true
   NEXT_PUBLIC_ENABLE_VIDEO_CALLS=true
   ```

### 4. Update CORS Settings

After deployment, update your backend CORS settings to include your Render frontend URL.

### 5. Test Your Deployment

1. **Backend Health Check**: Visit `https://your-backend-app.onrender.com/health`
2. **Frontend**: Visit `https://your-frontend-app.onrender.com`
3. **API Test**: Try registering a user and testing the symptom analysis

## Important Notes

### Free Tier Limitations
- **Sleep Mode**: Free services sleep after 15 minutes of inactivity
- **Cold Starts**: First request after sleep takes 30+ seconds
- **Build Time**: Limited to 500 build minutes per month

### Production Considerations
- Use Render's paid plans for production workloads
- Set up custom domains
- Configure proper monitoring and alerting
- Implement database backups
- Use environment-specific configurations

### Troubleshooting

**Build Failures**:
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

**Connection Issues**:
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check environment variables are set correctly
- Ensure CORS is configured for your frontend domain

**Performance Issues**:
- Monitor response times in Render dashboard
- Consider upgrading to paid plans for better performance
- Optimize database queries and API responses

## Security Checklist

- [ ] Change default JWT_SECRET and ENCRYPTION_KEY
- [ ] Use strong MongoDB Atlas credentials
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (automatic on Render)
- [ ] Set up monitoring and alerting
- [ ] Regular security updates

## Support

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas Support**: https://docs.atlas.mongodb.com/
- **Project Issues**: Create GitHub issues for project-specific problems