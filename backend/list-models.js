const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
  
  // Try to use the REST API directly to list models
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${process.env.GEMINI_API_KEY}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Available models:');
      data.models?.forEach(model => {
        console.log(`- ${model.name} (${model.displayName || 'No display name'})`);
        if (model.supportedGenerationMethods?.includes('generateContent')) {
          console.log(`  ✅ Supports generateContent`);
        }
      });
      
      // Test the first available model that supports generateContent
      const workingModel = data.models?.find(m => 
        m.supportedGenerationMethods?.includes('generateContent')
      );
      
      if (workingModel) {
        console.log(`\nTesting ${workingModel.name}...`);
        await testModel(workingModel.name);
      }
    } else {
      console.log('❌ Failed to fetch models:', response.status, response.statusText);
      await fallbackTest();
    }
  } catch (error) {
    console.log('❌ Error fetching models:', error.message);
    await fallbackTest();
  }
}

async function testModel(modelName) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hello, this is a test message');
    const response = await result.response;
    const text = response.text();
    console.log(`✅ ${modelName} works! Response: ${text.substring(0, 100)}...`);
    return modelName;
  } catch (err) {
    console.log(`❌ ${modelName}: ${err.message.split('\n')[0]}`);
    return null;
  }
}

async function fallbackTest() {
  console.log('\nTrying fallback model names...');
  const commonModels = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest', 
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ];
  
  for (const modelName of commonModels) {
    const result = await testModel(modelName);
    if (result) {
      return result;
    }
  }
  
  console.log('❌ No working models found');
}

listModels();