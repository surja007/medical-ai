const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
  }

  async analyzeSymptoms(data) {
    try {
      const { symptoms, userInfo, additionalInfo } = data;

      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'AIzaSyD8rAgyZ_ORf16z-jWgw1LX3TVbTJYC6GA') {
        logger.warn('Gemini API key not configured, using fallback analysis');
        return this.getFallbackSymptomAnalysis(symptoms, userInfo);
      }

      const prompt = this.buildSymptomAnalysisPrompt(symptoms, userInfo, additionalInfo);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the structured response
      const analysis = this.parseSymptomAnalysis(text);
      
      return {
        analysis,
        rawResponse: text,
        confidence: analysis.confidence || 0.8
      };
    } catch (error) {
      logger.error('Gemini symptom analysis error:', error);
      
      // If API error, provide fallback analysis
      if (error.message.includes('API key') || error.message.includes('400') || error.message.includes('401')) {
        logger.warn('API key issue detected, using fallback analysis');
        return this.getFallbackSymptomAnalysis(data.symptoms, data.userInfo);
      }
      
      throw new Error('Failed to analyze symptoms with AI');
    }
  }

  async analyzeHealthImage(imageData, symptoms, bodyPart) {
    try {
      // Check if API key is configured
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'AIzaSyD8rAgyZ_ORf16z-jWgw1LX3TVbTJYC6GA') {
        logger.warn('Gemini API key not configured, using fallback analysis');
        return {
          analysis: this.getDefaultImageAnalysis(),
          rawResponse: 'Fallback analysis used'
        };
      }

      const prompt = this.buildImageAnalysisPrompt(symptoms, bodyPart);
      
      const imagePart = {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg"
        }
      };

      // Add timeout wrapper
      const analysisPromise = this.model.generateContent([prompt, imagePart]);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Analysis timeout')), 25000)
      );

      const result = await Promise.race([analysisPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();

      return {
        analysis: this.parseImageAnalysis(text),
        rawResponse: text
      };
    } catch (error) {
      logger.error('Gemini image analysis error:', error);
      
      // Return fallback analysis instead of throwing
      return {
        analysis: this.getDefaultImageAnalysis(),
        rawResponse: 'Fallback analysis due to error: ' + error.message
      };
    }
  }

  async chatWithAssistant(message, context = {}) {
    try {
      const prompt = this.buildAssistantPrompt(message, context);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        response: text,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Gemini assistant chat error:', error);
      throw new Error('Failed to get assistant response');
    }
  }

  buildSymptomAnalysisPrompt(symptoms, userInfo, additionalInfo) {
    return `
You are an advanced AI medical assistant. Analyze the following symptoms and provide a structured medical assessment.

PATIENT INFORMATION:
- Age: ${userInfo.age || 'Not provided'}
- Gender: ${userInfo.gender || 'Not provided'}
- Medical History: ${userInfo.medicalHistory?.join(', ') || 'None provided'}
- Current Medications: ${userInfo.currentMedications?.join(', ') || 'None provided'}

SYMPTOMS:
${symptoms.map(s => `- ${s.name}: Severity ${s.severity}/10, Duration: ${s.duration}${s.description ? `, Description: ${s.description}` : ''}${s.bodyPart ? `, Body Part: ${s.bodyPart}` : ''}`).join('\n')}

ADDITIONAL INFORMATION:
${additionalInfo ? Object.entries(additionalInfo).map(([key, value]) => `- ${key}: ${value}`).join('\n') : 'None provided'}

Please provide your analysis in the following JSON format:
{
  "possibleConditions": [
    {
      "condition": "Condition name",
      "probability": 0.0-1.0,
      "severity": "low|moderate|high|critical",
      "description": "Brief description",
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ],
  "urgencyLevel": "low|moderate|high|emergency",
  "recommendedActions": ["action1", "action2"],
  "warningFlags": ["flag1", "flag2"],
  "followUpRecommended": true|false,
  "estimatedTimeToSeekCare": "timeframe"
}

IMPORTANT GUIDELINES:
- Always err on the side of caution
- If symptoms suggest emergency conditions, set urgencyLevel to "emergency"
- Provide clear, actionable recommendations
- Include relevant warning flags
- Do not provide definitive diagnoses, only possibilities
- Recommend professional medical consultation when appropriate
`;
  }

  buildImageAnalysisPrompt(symptoms, bodyPart) {
    return `
You are an advanced AI medical assistant specializing in visual health assessment. Analyze the provided medical image.

CONTEXT:
- Body Part: ${bodyPart}
- Associated Symptoms: ${symptoms?.join(', ') || 'None provided'}

Please analyze the image and provide assessment in the following JSON format:
{
  "detectedConditions": [
    {
      "condition": "Condition name",
      "confidence": 0.0-1.0,
      "severity": "low|moderate|high|critical",
      "description": "What you observe",
      "recommendations": ["recommendation1", "recommendation2"]
    }
  ],
  "imageQuality": {
    "score": 0.0-1.0,
    "issues": ["issue1", "issue2"]
  },
  "urgencyLevel": "low|moderate|high|emergency",
  "recommendedActions": ["action1", "action2"],
  "requiresProfessionalReview": true|false,
  "textualDescription": "Detailed description of what you see",
  "medicalInsights": "Professional medical insights",
  "recommendations": ["general recommendation1", "general recommendation2"]
}

IMPORTANT:
- Focus on visible abnormalities
- Consider image quality in your assessment
- Always recommend professional evaluation for concerning findings
- Do not provide definitive diagnoses
`;
  }

  buildAssistantPrompt(message, context) {
    const userLocation = context.userLocation ? `${context.userLocation.latitude}, ${context.userLocation.longitude}` : null;
    
    return `
You are a compassionate AI health assistant. Provide helpful, accurate, and supportive responses to health-related questions.

CONTEXT:
${context.userProfile ? `User Profile: ${JSON.stringify(context.userProfile)}` : ''}
${context.recentAnalyses ? `Recent Health Analyses: ${JSON.stringify(context.recentAnalyses)}` : ''}
${context.conversationHistory ? `Previous Messages: ${JSON.stringify(context.conversationHistory)}` : ''}
${userLocation ? `User Location: ${userLocation}` : ''}

USER MESSAGE: ${message}

CRITICAL GUIDELINES:
- Be empathetic and supportive
- Provide accurate health information
- ALWAYS include a medical disclaimer in your response
- ALWAYS recommend consulting healthcare professionals for medical concerns
- Do not provide specific medical diagnoses
- Offer practical health tips and general guidance
- If the question is about emergency symptoms, emphasize seeking immediate medical attention
- Keep responses conversational but professional
- If user hasn't provided location, ask for it to suggest nearby doctors

MANDATORY RESPONSE FORMAT:
1. Provide your helpful response to the user's question
2. ALWAYS end with this disclaimer section:

**⚠️ MEDICAL DISCLAIMER:**
This information is for educational purposes only and should not replace professional medical advice. Please consult with a qualified healthcare provider for proper diagnosis and treatment.

**🏥 FIND NEARBY DOCTORS:**
${userLocation ? 
  'Based on your location, I recommend consulting with nearby healthcare providers. You can find doctors in your area using our doctor finder feature.' : 
  'To help you find nearby doctors, please share your location or city name. This will help me suggest qualified healthcare providers in your area.'
}

**🚨 EMERGENCY WARNING:**
If you experience severe symptoms, chest pain, difficulty breathing, severe bleeding, or any life-threatening condition, call emergency services immediately (108 in India, 911 in US) or visit the nearest emergency room.

REMEMBER: Always prioritize user safety and encourage professional medical consultation for any health concerns.
`;
  }

  parseSymptomAnalysis(text) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if JSON is not properly formatted
      return this.fallbackSymptomParsing(text);
    } catch (error) {
      logger.error('Error parsing symptom analysis:', error);
      return this.getDefaultSymptomAnalysis();
    }
  }

  parseImageAnalysis(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return this.fallbackImageParsing(text);
    } catch (error) {
      logger.error('Error parsing image analysis:', error);
      return this.getDefaultImageAnalysis();
    }
  }

  fallbackSymptomParsing(text) {
    // Simple fallback parsing logic
    const urgencyKeywords = {
      emergency: ['emergency', 'urgent', 'immediate', 'critical'],
      high: ['serious', 'concerning', 'worrying'],
      moderate: ['moderate', 'attention'],
      low: ['mild', 'minor', 'low']
    };

    let urgencyLevel = 'moderate';
    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
        urgencyLevel = level;
        break;
      }
    }

    return {
      possibleConditions: [{
        condition: "Analysis requires professional review",
        probability: 0.5,
        severity: urgencyLevel,
        description: "AI analysis completed but requires medical professional interpretation",
        recommendations: ["Consult with a healthcare provider"]
      }],
      urgencyLevel,
      recommendedActions: ["Consult with a healthcare provider"],
      warningFlags: [],
      followUpRecommended: true,
      estimatedTimeToSeekCare: urgencyLevel === 'emergency' ? 'Immediately' : '24-48 hours'
    };
  }

  fallbackImageParsing(text) {
    return {
      detectedConditions: [{
        condition: "Image requires professional review",
        confidence: 0.5,
        severity: "moderate",
        description: "Image analysis completed but requires professional interpretation",
        recommendations: ["Consult with a healthcare provider"]
      }],
      imageQuality: {
        score: 0.7,
        issues: []
      },
      urgencyLevel: "moderate",
      recommendedActions: ["Consult with a healthcare provider"],
      requiresProfessionalReview: true,
      textualDescription: "Image analysis completed",
      medicalInsights: "Professional medical evaluation recommended",
      recommendations: ["Consult with a healthcare provider"]
    };
  }

  getDefaultSymptomAnalysis() {
    return {
      possibleConditions: [{
        condition: "Unable to analyze - please consult a healthcare provider",
        probability: 0.5,
        severity: "moderate",
        description: "Analysis could not be completed",
        recommendations: ["Consult with a healthcare provider immediately"]
      }],
      urgencyLevel: "moderate",
      recommendedActions: ["Consult with a healthcare provider"],
      warningFlags: ["Analysis incomplete"],
      followUpRecommended: true,
      estimatedTimeToSeekCare: "24 hours"
    };
  }

  getDefaultImageAnalysis() {
    return {
      detectedConditions: [{
        condition: "Unable to analyze - please consult a healthcare provider",
        confidence: 0.5,
        severity: "moderate",
        description: "Image analysis could not be completed",
        recommendations: ["Consult with a healthcare provider"]
      }],
      imageQuality: {
        score: 0.5,
        issues: ["Analysis incomplete"]
      },
      urgencyLevel: "moderate",
      recommendedActions: ["Consult with a healthcare provider"],
      requiresProfessionalReview: true,
      textualDescription: "Image analysis incomplete",
      medicalInsights: "Professional evaluation required",
      recommendations: ["Consult with a healthcare provider"]
    };
  }

  getFallbackSymptomAnalysis(symptoms, userInfo) {
    // Create a more intelligent fallback analysis based on symptoms
    const highSeveritySymptoms = symptoms.filter(s => s.severity >= 8);
    const emergencyKeywords = ['chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious', 'stroke', 'heart attack'];
    const hasEmergencySymptoms = symptoms.some(s => 
      emergencyKeywords.some(keyword => s.name.toLowerCase().includes(keyword))
    );

    let urgencyLevel = 'low';
    let timeToSeekCare = '1-2 weeks';
    let warningFlags = [];

    if (hasEmergencySymptoms) {
      urgencyLevel = 'emergency';
      timeToSeekCare = 'Immediately - Call emergency services';
      warningFlags.push('Potential emergency symptoms detected');
    } else if (highSeveritySymptoms.length > 0) {
      urgencyLevel = 'high';
      timeToSeekCare = '24-48 hours';
      warningFlags.push('High severity symptoms present');
    } else if (symptoms.some(s => s.severity >= 6)) {
      urgencyLevel = 'moderate';
      timeToSeekCare = '3-7 days';
    }

    // Generate condition suggestions based on common symptoms
    const possibleConditions = this.generateConditionSuggestions(symptoms);

    return {
      analysis: {
        possibleConditions,
        urgencyLevel,
        recommendedActions: [
          'Monitor symptoms closely',
          'Keep a symptom diary',
          'Stay hydrated and get adequate rest',
          'Consult with a healthcare provider for proper diagnosis',
          ...(urgencyLevel === 'emergency' ? ['Seek immediate medical attention'] : [])
        ],
        warningFlags,
        followUpRecommended: true,
        estimatedTimeToSeekCare: timeToSeekCare,
        confidence: 0.6
      },
      rawResponse: 'Fallback analysis generated due to AI service unavailability',
      confidence: 0.6,
      fallback: true
    };
  }

  generateConditionSuggestions(symptoms) {
    const conditions = [];
    
    // Common symptom patterns
    const symptomPatterns = {
      'headache': {
        conditions: ['Tension headache', 'Migraine', 'Dehydration'],
        probability: 0.7
      },
      'fever': {
        conditions: ['Viral infection', 'Bacterial infection', 'Flu'],
        probability: 0.8
      },
      'cough': {
        conditions: ['Common cold', 'Bronchitis', 'Allergies'],
        probability: 0.7
      },
      'nausea': {
        conditions: ['Gastroenteritis', 'Food poisoning', 'Motion sickness'],
        probability: 0.6
      },
      'fatigue': {
        conditions: ['Viral infection', 'Sleep deprivation', 'Stress'],
        probability: 0.6
      }
    };

    symptoms.forEach(symptom => {
      const symptomName = symptom.name.toLowerCase();
      
      for (const [pattern, data] of Object.entries(symptomPatterns)) {
        if (symptomName.includes(pattern)) {
          data.conditions.forEach(condition => {
            const severity = symptom.severity >= 7 ? 'moderate' : 'low';
            conditions.push({
              condition,
              probability: data.probability * (symptom.severity / 10),
              severity,
              description: `Based on reported ${symptom.name.toLowerCase()} symptoms`,
              recommendations: [
                'Monitor symptoms',
                'Rest and stay hydrated',
                'Consult healthcare provider if symptoms worsen'
              ]
            });
          });
          break;
        }
      }
    });

    // If no specific patterns matched, provide general condition
    if (conditions.length === 0) {
      conditions.push({
        condition: 'General health concern',
        probability: 0.5,
        severity: 'moderate',
        description: 'Symptoms require professional medical evaluation',
        recommendations: [
          'Document all symptoms',
          'Monitor changes over time',
          'Consult with a healthcare provider'
        ]
      });
    }

    return conditions.slice(0, 3); // Return top 3 conditions
  }
}

module.exports = new GeminiService();