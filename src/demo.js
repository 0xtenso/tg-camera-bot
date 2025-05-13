/**
 * Telegram Camera Bot Demo
 * This script demonstrates how to use the bot with sample photos and videos
 */

const fs = require('fs');
const path = require('path');
const CameraBot = require('./bot');

// Check if token is provided as command-line argument
const token = process.argv[2];

if (!token) {
  console.error('Error: Bot token is required as a command-line argument');
  console.error('Usage: node demo.js YOUR_BOT_TOKEN');
  process.exit(1);
}

console.log('Starting Telegram Camera Bot demo...');

// Initialize bot with provided token
const bot = new CameraBot(token);

// Create sample directories if they don't exist
const sampleDir = path.join(__dirname, '../samples');
if (!fs.existsSync(sampleDir)) {
  fs.mkdirSync(sampleDir, { recursive: true });
}

// Display instructions for testing
console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Telegram Camera Bot is now running! 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open Telegram and search for your bot (created with @BotFather)
2. Start a conversation with your bot by sending /start
3. Send the following commands to test functionality:
   - /photo - To switch to photo mode
   - /video - To switch to video mode
   - /settings - To adjust camera settings
   - /help - For more information
   
4. Send photos or videos from your device to see them processed

Bot Status: Online 🟢
Press Ctrl+C to stop the bot

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nStopping Telegram Camera Bot...');
  process.exit(0);
}); 