# Gemini AI API Setup Guide

The Smart Health Platform uses Google's Gemini 2.5 Pro AI for advanced symptom analysis. Currently, the system is running with fallback analysis due to an invalid API key.

## Getting a Valid Gemini API Key

### Step 1: Visit Google AI Studio
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account

### Step 2: Create API Key
1. Click on "Get API Key" in the left sidebar
2. Click "Create API Key"
3. Select "Create API key in new project" or choose an existing project
4. Copy the generated API key

### Step 3: Update Environment Variables
1. Open `backend/.env` file
2. Replace the current `GEMINI_API_KEY` value with your new API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### Step 4: Restart the Backend Server
```bash
cd backend
npm run dev
```

## Current Status

✅ **Fallback Analysis**: The system provides intelligent symptom analysis based on medical patterns
⚠️ **AI Enhancement**: Full AI-powered analysis requires a valid Gemini API key

## Features Available

### With Fallback Analysis:
- Symptom severity assessment
- Basic condition suggestions
- Urgency level determination
- Safety recommendations
- Emergency symptom detection

### With Full AI (Gemini API):
- Advanced medical reasoning
- Detailed condition analysis
- Personalized recommendations
- Medical history integration
- Enhanced accuracy

## API Key Benefits

- **Free Tier**: Google provides generous free usage limits
- **Advanced Analysis**: More accurate and detailed symptom interpretation
- **Personalization**: Analysis considers user's medical history and demographics
- **Real-time**: Instant AI-powered medical insights

## Troubleshooting

If you encounter issues:

1. **Invalid API Key**: Ensure the key is copied correctly without extra spaces
2. **Quota Exceeded**: Check your Google Cloud Console for usage limits
3. **Network Issues**: Verify internet connection and firewall settings

## Security Note

- Never commit API keys to version control
- Keep your `.env` file secure and private
- Regularly rotate API keys for security

The platform will automatically detect when a valid API key is configured and switch from fallback to full AI analysis.