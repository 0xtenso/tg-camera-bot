# Troubleshooting Guide

## Common Issues

### Bot doesn't respond
- Check your bot token in `.env`
- Ensure the bot is running (`npm start`)
- Verify your internet connection

### Media Processing Issues
- For slow processing: use smaller videos or 720p quality
- "Error processing": check disk space and file formats

### Installation Issues
- "Module not found": run `npm install`
- FFMPEG issues: install ffmpeg manually (`choco install ffmpeg` on Windows)

### Environment Setup
- Create `.env` file with `BOT_TOKEN=your_token_here`
- For port conflicts: change `PORT=3000` to another value

## Getting Help
- Check logs for error messages
- Search Telegram Bot API documentation
- Update dependencies with `npm install` 