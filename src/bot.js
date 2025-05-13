const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const mediaHandler = require('./mediaHandler');

class CameraBot {
  constructor(token) {
    this.bot = new TelegramBot(token, { polling: true });
    this.userSessions = {};
    
    // Camera mode options
    this.CAMERA_MODES = {
      PHOTO: 'photo',
      VIDEO: 'video'
    };
    
    // Video durations
    this.VIDEO_DURATIONS = [10, 15, 30, 60];
    
    this.initializeCommands();
  }
  
  initializeCommands() {
    // Start command
    this.bot.onText(/\/start/, (msg) => this.handleStart(msg));
    
    // Help command
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    
    // Photo mode
    this.bot.onText(/\/photo|📷 Photo Mode/, (msg) => this.activatePhotoMode(msg));
    
    // Video mode
    this.bot.onText(/\/video|🎥 Video Mode/, (msg) => this.activateVideoMode(msg));
    
    // Settings menu
    this.bot.onText(/\/settings|⚙️ Settings/, (msg) => this.showSettings(msg));
    
    // Flash toggle
    this.bot.onText(/\/flash|⚡ Toggle Flash/, (msg) => this.toggleFlash(msg));
    
    // Timer toggle
    this.bot.onText(/\/timer|⏱️ Toggle Timer/, (msg) => this.toggleTimer(msg));
    
    // Video duration
    this.bot.onText(/\/duration|🎞️ Set Duration/, (msg) => this.showDurationOptions(msg));
    
    // Video quality
    this.bot.onText(/\/quality|🔎 Change Quality/, (msg) => this.toggleQuality(msg));
    
    // Handle callback queries
    this.bot.on('callback_query', (query) => this.handleCallbackQuery(query));
    
    // Handle received photos
    this.bot.on('photo', async (msg) => this.handlePhoto(msg));
    
    // Handle received videos
    this.bot.on('video', async (msg) => this.handleVideo(msg));
    
    // Main keyboard navigation
    this.bot.on('message', (msg) => this.handleNavigation(msg));
  }
  
  handleStart(msg) {
    const chatId = msg.chat.id;
    
    // Initialize user session
    this.userSessions[chatId] = {
      mode: this.CAMERA_MODES.PHOTO,
      videoDuration: 30,
      videoQuality: '1080p',
      flashMode: 'off',
      useTimer: false
    };
    
    const welcomeMessage = `
Welcome to Camera Bot! 📸
    
This bot allows you to take photos and record videos with various options.

Available commands:
/photo - Switch to photo mode
/video - Switch to video mode
/settings - Adjust camera settings
/help - Show help information
`;

    this.bot.sendMessage(chatId, welcomeMessage, {
      reply_markup: {
        keyboard: [
          ['📷 Photo Mode', '🎥 Video Mode'],
          ['⚙️ Settings', '❓ Help']
        ],
        resize_keyboard: true
      }
    });
  }
  
  handleHelp(msg) {
    const chatId = msg.chat.id;
    
    const helpMessage = `
Camera Bot Help 📋

Commands:
/start - Start the bot and show main menu
/photo - Switch to photo mode
/video - Switch to video mode
/settings - View and change camera settings
/flash - Toggle flash mode (photo only)
/timer - Toggle 3-second timer (photo only)
/quality - Toggle video quality (video only)
/duration - Set video recording duration

How to use:
1. Select photo or video mode
2. Adjust settings as needed
3. Send a photo or video from your device
4. The bot will process it according to your settings
`;

    this.bot.sendMessage(chatId, helpMessage);
  }
  
  activatePhotoMode(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = {};
    }
    
    this.userSessions[chatId].mode = this.CAMERA_MODES.PHOTO;
    
    this.bot.sendMessage(chatId, 'Photo mode activated! 📷 Send me a photo or selfie.', {
      reply_markup: {
        keyboard: [
          ['📸 Take Photo', '⚡ Toggle Flash'],
          ['⏱️ Toggle Timer', '🔙 Back to Menu']
        ],
        resize_keyboard: true
      }
    });
  }
  
  activateVideoMode(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = {};
    }
    
    this.userSessions[chatId].mode = this.CAMERA_MODES.VIDEO;
    
    this.bot.sendMessage(chatId, 'Video mode activated! 🎥 Send me a video to process.', {
      reply_markup: {
        keyboard: [
          ['🎬 Record Video', '🎞️ Set Duration'],
          ['🔎 Change Quality', '🔙 Back to Menu']
        ],
        resize_keyboard: true
      }
    });
  }
  
  showSettings(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = {
        mode: this.CAMERA_MODES.PHOTO,
        videoDuration: 30,
        videoQuality: '1080p',
        flashMode: 'off',
        useTimer: false
      };
    }
    
    const session = this.userSessions[chatId];
    
    const settingsMessage = `
Current Settings:

Mode: ${session.mode === this.CAMERA_MODES.PHOTO ? 'Photo 📷' : 'Video 🎥'}
${session.mode === this.CAMERA_MODES.PHOTO ? 
  `Flash: ${session.flashMode} ⚡
Timer: ${session.useTimer ? 'On ⏱️' : 'Off'}` : 
  `Duration: ${session.videoDuration}s ⏱️
Quality: ${session.videoQuality} 🔎`}
`;

    this.bot.sendMessage(chatId, settingsMessage, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: 'Change Mode', callback_data: 'toggle_mode' }
          ],
          ...(session.mode === this.CAMERA_MODES.PHOTO ? [
            [
              { text: 'Toggle Flash', callback_data: 'toggle_flash' },
              { text: 'Toggle Timer', callback_data: 'toggle_timer' }
            ]
          ] : [
            [
              { text: 'Change Duration', callback_data: 'set_duration' },
              { text: 'Change Quality', callback_data: 'toggle_quality' }
            ]
          ]),
          [
            { text: 'Back to Main Menu', callback_data: 'back_to_menu' }
          ]
        ]
      }
    });
  }
  
  toggleFlash(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = { mode: this.CAMERA_MODES.PHOTO, flashMode: 'off' };
    }
    
    const flashModes = ['off', 'on', 'auto'];
    const currentIndex = flashModes.indexOf(this.userSessions[chatId].flashMode);
    const nextIndex = (currentIndex + 1) % flashModes.length;
    this.userSessions[chatId].flashMode = flashModes[nextIndex];
    
    this.bot.sendMessage(chatId, `Flash mode set to: ${this.userSessions[chatId].flashMode} ⚡`);
  }
  
  toggleTimer(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = { mode: this.CAMERA_MODES.PHOTO, useTimer: false };
    }
    
    this.userSessions[chatId].useTimer = !this.userSessions[chatId].useTimer;
    
    this.bot.sendMessage(
      chatId, 
      `Timer ${this.userSessions[chatId].useTimer ? 'activated' : 'deactivated'} ⏱️`
    );
  }
  
  showDurationOptions(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = { mode: this.CAMERA_MODES.VIDEO, videoDuration: 30 };
    }
    
    this.bot.sendMessage(chatId, 'Select video duration:', {
      reply_markup: {
        inline_keyboard: this.VIDEO_DURATIONS.map(duration => [
          { text: `${duration} seconds`, callback_data: `duration_${duration}` }
        ])
      }
    });
  }
  
  toggleQuality(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = { mode: this.CAMERA_MODES.VIDEO, videoQuality: '1080p' };
    }
    
    this.userSessions[chatId].videoQuality = 
      this.userSessions[chatId].videoQuality === '1080p' ? '720p' : '1080p';
    
    this.bot.sendMessage(
      chatId, 
      `Video quality set to: ${this.userSessions[chatId].videoQuality} 🔎`
    );
  }
  
  async handleCallbackQuery(callbackQuery) {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = {
        mode: this.CAMERA_MODES.PHOTO,
        videoDuration: 30,
        videoQuality: '1080p',
        flashMode: 'off',
        useTimer: false
      };
    }
    
    if (data === 'toggle_mode') {
      this.userSessions[chatId].mode = 
        this.userSessions[chatId].mode === this.CAMERA_MODES.PHOTO ? 
          this.CAMERA_MODES.VIDEO : this.CAMERA_MODES.PHOTO;
      
      this.bot.answerCallbackQuery(callbackQuery.id, {
        text: `Switched to ${this.userSessions[chatId].mode} mode`
      });
      
      // Refresh settings display
      this.bot.editMessageText(`Current mode: ${this.userSessions[chatId].mode.toUpperCase()}`, {
        chat_id: chatId,
        message_id: callbackQuery.message.message_id
      });
      
      // Call the settings command to refresh the entire menu
      setTimeout(() => {
        this.showSettings({ chat: { id: chatId } });
      }, 500);
    } 
    else if (data === 'toggle_flash') {
      const flashModes = ['off', 'on', 'auto'];
      const currentIndex = flashModes.indexOf(this.userSessions[chatId].flashMode);
      const nextIndex = (currentIndex + 1) % flashModes.length;
      this.userSessions[chatId].flashMode = flashModes[nextIndex];
      
      this.bot.answerCallbackQuery(callbackQuery.id, {
        text: `Flash set to: ${this.userSessions[chatId].flashMode}`
      });
      
      // Refresh settings
      setTimeout(() => {
        this.showSettings({ chat: { id: chatId } });
      }, 500);
    } 
    else if (data === 'toggle_timer') {
      this.userSessions[chatId].useTimer = !this.userSessions[chatId].useTimer;
      
      this.bot.answerCallbackQuery(callbackQuery.id, {
        text: `Timer ${this.userSessions[chatId].useTimer ? 'activated' : 'deactivated'}`
      });
      
      // Refresh settings
      setTimeout(() => {
        this.showSettings({ chat: { id: chatId } });
      }, 500);
    } 
    else if (data === 'toggle_quality') {
      this.userSessions[chatId].videoQuality = 
        this.userSessions[chatId].videoQuality === '1080p' ? '720p' : '1080p';
      
      this.bot.answerCallbackQuery(callbackQuery.id, {
        text: `Quality set to: ${this.userSessions[chatId].videoQuality}`
      });
      
      // Refresh settings
      setTimeout(() => {
        this.showSettings({ chat: { id: chatId } });
      }, 500);
    } 
    else if (data === 'set_duration') {
      this.bot.answerCallbackQuery(callbackQuery.id);
      
      this.showDurationOptions({ chat: { id: chatId } });
    } 
    else if (data.startsWith('duration_')) {
      const duration = parseInt(data.split('_')[1]);
      this.userSessions[chatId].videoDuration = duration;
      
      this.bot.answerCallbackQuery(callbackQuery.id, {
        text: `Duration set to: ${duration} seconds`
      });
      
      // Refresh settings
      setTimeout(() => {
        this.showSettings({ chat: { id: chatId } });
      }, 500);
    }
    else if (data === 'back_to_menu') {
      this.bot.answerCallbackQuery(callbackQuery.id);
      
      this.bot.sendMessage(chatId, 'Main Menu', {
        reply_markup: {
          keyboard: [
            ['📷 Photo Mode', '🎥 Video Mode'],
            ['⚙️ Settings', '❓ Help']
          ],
          resize_keyboard: true
        }
      });
    }
  }
  
  async handlePhoto(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = {
        mode: this.CAMERA_MODES.PHOTO,
        flashMode: 'off',
        useTimer: false
      };
    }
    
    // Check if in photo mode
    if (this.userSessions[chatId].mode !== this.CAMERA_MODES.PHOTO) {
      return this.bot.sendMessage(chatId, 'Please switch to photo mode first using /photo or "📷 Photo Mode" button.');
    }
    
    try {
      const waitMessage = this.bot.sendMessage(chatId, 'Processing your photo... ⏳');
      
      // Get the largest photo from the message
      const photo = msg.photo[msg.photo.length - 1];
      const fileId = photo.file_id;
      
      // Send timer message if timer is enabled
      if (this.userSessions[chatId].useTimer) {
        await this.bot.sendMessage(chatId, 'Timer activated! Taking photo in 3...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.bot.sendMessage(chatId, '2...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.bot.sendMessage(chatId, '1...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.bot.sendMessage(chatId, '📸 Cheese!');
      }
      
      // Download the photo
      const filePath = await mediaHandler.downloadFile(this.bot, fileId);
      
      // Process the photo according to settings
      const processedFilePath = await mediaHandler.processPhoto(filePath, this.userSessions[chatId]);
      
      // Send processed photo back to user
      await this.bot.sendPhoto(chatId, processedFilePath, {
        caption: `Processed photo with settings:\nFlash: ${this.userSessions[chatId].flashMode}`
      });
      
      // Clean up files
      mediaHandler.cleanupFile(filePath);
      mediaHandler.cleanupFile(processedFilePath);
      
    } catch (error) {
      console.error('Error processing photo:', error);
      this.bot.sendMessage(chatId, 'Sorry, there was an error processing your photo. Please try again.');
    }
  }
  
  async handleVideo(msg) {
    const chatId = msg.chat.id;
    
    if (!this.userSessions[chatId]) {
      this.userSessions[chatId] = {
        mode: this.CAMERA_MODES.VIDEO,
        videoDuration: 30,
        videoQuality: '1080p'
      };
    }
    
    // Check if in video mode
    if (this.userSessions[chatId].mode !== this.CAMERA_MODES.VIDEO) {
      return this.bot.sendMessage(chatId, 'Please switch to video mode first using /video or "🎥 Video Mode" button.');
    }
    
    try {
      const waitMessage = await this.bot.sendMessage(chatId, 'Processing your video... ⏳');
      
      // Get video file ID
      const fileId = msg.video.file_id;
      
      // Download the video
      const filePath = await mediaHandler.downloadFile(this.bot, fileId);
      
      // Process the video according to settings
      this.bot.editMessageText('Applying video settings... this may take a moment', {
        chat_id: chatId,
        message_id: waitMessage.message_id
      });
      
      const processedFilePath = await mediaHandler.processVideo(filePath, this.userSessions[chatId]);
      
      // Send processed video back to user
      await this.bot.sendVideo(chatId, processedFilePath, {
        caption: `Processed video with settings:\nQuality: ${this.userSessions[chatId].videoQuality}\nMax Duration: ${this.userSessions[chatId].videoDuration}s`
      });
      
      // Clean up files
      mediaHandler.cleanupFile(filePath);
      mediaHandler.cleanupFile(processedFilePath);
      
    } catch (error) {
      console.error('Error processing video:', error);
      this.bot.sendMessage(chatId, 'Sorry, there was an error processing your video. Please try again.');
    }
  }
  
  handleNavigation(msg) {
    if (!msg.text) return;
    
    const chatId = msg.chat.id;
    
    if (msg.text === '🔙 Back to Menu') {
      this.bot.sendMessage(chatId, 'Main Menu', {
        reply_markup: {
          keyboard: [
            ['📷 Photo Mode', '🎥 Video Mode'],
            ['⚙️ Settings', '❓ Help']
          ],
          resize_keyboard: true
        }
      });
    }
    else if (msg.text === '📸 Take Photo') {
      this.bot.sendMessage(chatId, 'Please send me a photo from your camera or gallery.');
    }
    else if (msg.text === '🎬 Record Video') {
      this.bot.sendMessage(chatId, 'Please send me a video from your camera or gallery.');
    }
  }
  
  // Method to get bot instance
  getBot() {
    return this.bot;
  }
}

module.exports = CameraBot; 