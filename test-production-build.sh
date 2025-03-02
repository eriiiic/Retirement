#!/bin/bash

# Test Script for Retirement Planning App Production Build
# This script will check key features of the production build

# Configuration
SERVER_PORT=56082
SERVER_URL="http://localhost:$SERVER_PORT"

echo "🧪 Testing production build at $SERVER_URL"

# Function to check if a URL returns a 200 status code
check_url() {
  local url=$1
  local description=$2
  
  echo -n "🔍 Testing $description... "
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $url)
  
  if [ $HTTP_STATUS -eq 200 ]; then
    echo "✅ Success!"
  else
    echo "❌ Failed! (HTTP Status: $HTTP_STATUS)"
  fi
}

# Test 1: Check if the main page loads
check_url "$SERVER_URL" "Main application page"

# Test 2: Check if the assets load correctly
check_url "$SERVER_URL/static/js/main.c4048648.js" "Main JavaScript bundle"
check_url "$SERVER_URL/static/css/main.b1c06b0e.css" "Main CSS bundle"

# Test 3: Check SPA routing - should return the index.html for any route
check_url "$SERVER_URL/simulate" "SPA routing (simulate path)"

echo ""
echo "📱 Now let's test application features that require manual verification:"
echo ""
echo "1. Check if the retirement simulator loads and displays graphs correctly"
echo "   Open $SERVER_URL in your browser"
echo ""
echo "2. Verify that financial calculations work correctly:"
echo "   - Adjust initial investment amount"
echo "   - Modify monthly contribution"
echo "   - Change retirement duration"
echo "   - Adjust interest rate"
echo "   - Check if the simulator recalculates values appropriately"
echo ""
echo "3. Test web worker functionality:"
echo "   - Open browser developer tools (F12)"
echo "   - Go to Network tab and filter for 'worker'"
echo "   - Verify worker requests are being made when adjusting simulation parameters"
echo "   - Check Console tab for any errors related to workers"
echo ""
echo "4. Confirm responsive design:"
echo "   - Resize browser window to test different viewport sizes"
echo "   - Use browser dev tools to simulate mobile devices"
echo ""
echo "5. Check for console errors:"
echo "   - Open browser console (F12 > Console)"
echo "   - Verify no unexpected errors or warnings appear"
echo ""
echo "✅ Testing complete! Please perform the manual verification steps above." 