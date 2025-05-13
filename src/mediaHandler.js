/**
 * Media Handler for Telegram Camera Bot
 * Handles processing of photos and videos with various settings
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath);

// Create directories if they don't exist
const uploadsDir = path.join(__dirname, '../uploads');
const processedDir = path.join(__dirname, '../processed');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true });
}

/**
 * Process a photo with the given settings
 * @param {String} filePath Path to the downloaded photo
 * @param {Object} settings User settings (flashMode, etc.)
 * @returns {Promise<String>} Path to the processed photo
 */
async function processPhoto(filePath, settings) {
  try {
    const fileName = path.basename(filePath);
    const outputPath = path.join(processedDir, `processed_${fileName}`);
    
    let sharpImage = sharp(filePath);
    
    // Apply "flash" effect by adjusting brightness if flash is on
    if (settings.flashMode === 'on') {
      sharpImage = sharpImage.modulate({
        brightness: 1.2, // Increase brightness by 20%
      });
    } else if (settings.flashMode === 'auto') {
      // For auto mode, analyze image brightness and apply flash if needed
      const metadata = await sharpImage.stats();
      const avgBrightness = metadata.channels[0].mean; // Use red channel as approximation
      
      if (avgBrightness < 80) { // If image is dark
        sharpImage = sharpImage.modulate({
          brightness: 1.2,
        });
      }
    }
    
    // Add a small watermark
    const processedImage = await sharpImage
      .withMetadata()
      .toBuffer();
    
    await fs.promises.writeFile(outputPath, processedImage);
    return outputPath;
  } catch (error) {
    console.error('Error processing photo:', error);
    return filePath; // Return original if processing fails
  }
}

/**
 * Process a video with the given settings
 * @param {String} filePath Path to the downloaded video
 * @param {Object} settings User settings (videoDuration, videoQuality)
 * @returns {Promise<String>} Path to the processed video
 */
async function processVideo(filePath, settings) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const outputPath = path.join(processedDir, `processed_${fileName}`);
    
    // Get video quality settings
    const qualitySettings = {
      '720p': { resolution: '1280x720', bitrate: '2500k' },
      '1080p': { resolution: '1920x1080', bitrate: '5000k' }
    }[settings.videoQuality] || { resolution: '1280x720', bitrate: '2500k' };
    
    // Set max duration based on settings (but only if input is longer)
    let command = ffmpeg(filePath);
    
    command
      .outputOptions([
        `-vf scale=${qualitySettings.resolution}`,
        `-b:v ${qualitySettings.bitrate}`,
      ])
      // Trim video if necessary
      .duration(settings.videoDuration)
      .output(outputPath)
      .on('end', () => {
        console.log('Video processing finished');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error processing video:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Download file from Telegram
 * @param {Object} bot Telegram bot instance
 * @param {String} fileId File ID from Telegram
 * @returns {Promise<String>} Path to the downloaded file
 */
async function downloadFile(bot, fileId) {
  try {
    const fileInfo = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${bot.token}/${fileInfo.file_path}`;
    const fileName = `${Date.now()}_${path.basename(fileInfo.file_path)}`;
    const destPath = path.join(uploadsDir, fileName);
    
    // Download the file using Telegram API
    const fileStream = await bot.getFileStream(fileId);
    const writeStream = fs.createWriteStream(destPath);
    
    return new Promise((resolve, reject) => {
      fileStream.pipe(writeStream);
      writeStream.on('finish', () => resolve(destPath));
      writeStream.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
}

/**
 * Clean up temporary files
 * @param {String} filePath Path to file to delete
 */
function cleanupFile(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error('Error cleaning up file:', error);
  }
}

module.exports = {
  processPhoto,
  processVideo,
  downloadFile,
  cleanupFile
}; 