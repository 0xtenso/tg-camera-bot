// Main entry point for the Telegram Camera Bot
try {
  require('dotenv').config();
} catch (e) {
  console.log("dotenv not found, continuing without environment variables");
}

const express = require('express');
const CameraBot = require('./bot');

// Get bot token from environment variables
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('Error: BOT_TOKEN is not set in the environment variables.');
  console.error('Please create a .env file with BOT_TOKEN=your_telegram_bot_token');
  process.exit(1);
}

// Initialize the bot
const cameraBot = new CameraBot(token);

// Setup express server for webhooks (if needed)
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Telegram Camera Bot is running!');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log('Telegram Camera Bot is now running. Press Ctrl+C to exit.'); 