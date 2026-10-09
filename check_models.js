// check_models.js
require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No GEMINI_API_KEY found in .env.local!");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Potential model names to verify
  const candidates = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-pro"
  ];

  console.log("Testing model access with your API key...\n");

  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const res = await model.generateContent("ping");
      console.log(` SUCCESS: "${modelName}" is active and working!`);
      return modelName;
    } catch (err) {
      console.log(` FAIL: "${modelName}" -> ${err.message.split('\n')[0]}`);
    }
  }
}

testModels().then(workingModel => {
  if (workingModel) {
    const fs = require('fs');
    // Auto-update both routes with the working model
    ['src/app/api/chat/route.ts', 'src/app/api/extract/route.ts'].forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/model:\s*["'][^"']+["']/g, `model: "${workingModel}"`);
        fs.writeFileSync(file, content);
        console.log(`Updated ${file} to use "${workingModel}"`);
      }
    });
  }
});