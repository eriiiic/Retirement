#!/bin/bash

# Retirement Planning App Deployment Script

echo "🚀 Starting deployment process for Retirement Planning App..."

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Run tests
echo "🧪 Running tests..."
npm test -- --watchAll=false

# Check if tests passed
if [ $? -ne 0 ]; then
  echo "❌ Tests failed! Deployment aborted."
  exit 1
fi

# Step 3: Build the application
echo "🔨 Building application..."
npm run build

# Step 4: Optimize images (if needed)
# echo "🖼️ Optimizing images..."
# find build -name "*.jpg" -o -name "*.png" -o -name "*.svg" | xargs -P 8 -I {} optim-image "{}"

# Step 5: Create .env file in the build directory to ensure cache busting
echo "📄 Creating environment marker..."
date > build/.env-version

echo "✅ Build complete! Ready for deployment to web server."
echo ""
echo "To deploy to your web server:"
echo "1. Upload the contents of the 'build' folder to your web server's root directory"
echo "2. Ensure your web server is configured to serve index.html for all routes"
echo "3. Your application should now be accessible at your domain" 