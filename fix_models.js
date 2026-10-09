// fix_models.js
const fs = require('fs');

// 1. Fix src/app/api/chat/route.ts
const chatPath = 'src/app/api/chat/route.ts';
if (fs.existsSync(chatPath)) {
  let chatContent = fs.readFileSync(chatPath, 'utf8');
  chatContent = chatContent.replace(/model:\s*["']gemini-1.5-flash["']/g, 'model: "gemini-1.5-flash-latest"');
  fs.writeFileSync(chatPath, chatContent);
  console.log('✓ Updated chat model to gemini-1.5-flash-latest');
}

// 2. Fix src/app/api/extract/route.ts
const extractPath = 'src/app/api/extract/route.ts';
if (fs.existsSync(extractPath)) {
  let extractContent = fs.readFileSync(extractPath, 'utf8');
  extractContent = extractContent.replace(/model:\s*["']gemini-1.5-flash["']/g, 'model: "gemini-1.5-flash-latest"');
  fs.writeFileSync(extractPath, extractContent);
  console.log('✓ Updated extract model to gemini-1.5-flash-latest');
}