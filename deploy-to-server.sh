#!/bin/bash

# This script will deploy the application to your production server with /home as the root directory

# Server settings - CHANGE THESE VALUES!
SERVER_HOST="135.125.71.112"
SERVER_USER="eric@retired.ericdelattre.fr" 
SERVER_PATH="/"
SSH_PORT="22"

# Deploy with skipping tests
echo "🚀 Building application for production..."
./deploy-production.sh --skip-tests

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Deployment aborted."
  exit 1
fi

echo "🔄 Uploading files to server..."

# Check if rsync is available
if command -v rsync &> /dev/null; then
  # Use rsync for efficient file transfer
  rsync -avz --delete -e "ssh -p $SSH_PORT" build/ $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
else
  # Fallback to scp
  echo "⚠️ rsync not found, using scp instead (slower)."
  scp -P $SSH_PORT -r build/* $SERVER_USER@$SERVER_HOST:$SERVER_PATH/
fi

if [ $? -eq 0 ]; then
  echo "✅ Deployment complete! Your application is now live at:"
  echo "   http://$SERVER_HOST/home/"
  echo ""
  echo "📝 Remember to check the application thoroughly to ensure everything works correctly."
else
  echo "❌ Deployment failed. Please check your server settings and connection."
fi 