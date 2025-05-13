/**
 * Telegram Camera Bot Setup Script
 * Helps users configure their bot and creates necessary files
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🤖 Telegram Camera Bot Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Create directories if they don't exist
const dirs = ['uploads', 'processed'];
dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dir}`);
  } else {
    console.log(`ℹ️ Directory already exists: ${dir}`);
  }
});

// Check if .env exists, if not, create it
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  rl.question('\n📝 Enter your Telegram Bot Token (from @BotFather): ', (token) => {
    rl.question('🔢 Enter the server port (default: 3000): ', (port) => {
      const portNumber = port || '3000';
      
      // Create .env file
      const envContent = `BOT_TOKEN=${token}\nPORT=${portNumber}`;
      fs.writeFileSync(envPath, envContent);
      console.log('\n✅ Created .env file with your bot token');
      
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎉 Setup complete! You can now run the bot:');
      console.log('   npm start    - For normal operation');
      console.log('   npm run dev  - For development with auto-restart');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      rl.close();
    });
  });
} else {
  console.log('\n⚠️ .env file already exists. To reconfigure, delete it first.');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 Setup already complete! You can run the bot:');
  console.log('   npm start    - For normal operation');
  console.log('   npm run dev  - For development with auto-restart');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  rl.close();
} 