#!/bin/bash

# DMG Creation Script for Bihar Police Notebook
# This script creates a professional DMG installer

# Configuration
APP_NAME="Bihar Police Notebook"
DMG_NAME="${APP_NAME// /-}.dmg"
APP_PATH="dist/${APP_NAME// /-}.app"
DMG_PATH="dist/${DMG_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Creating DMG for ${APP_NAME} ===${NC}"

# Check if create-dmg is installed
if ! command -v create-dmg &> /dev/null; then
    echo -e "${RED}❌ create-dmg is not installed${NC}"
    echo -e "${YELLOW}Please install it with: brew install create-dmg${NC}"
    exit 1
fi

# Check if app exists
if [ ! -d "$APP_PATH" ]; then
    echo -e "${RED}❌ App not found at: $APP_PATH${NC}"
    echo -e "${YELLOW}Please build the app first with: make build${NC}"
    exit 1
fi

# Clean up old DMG
if [ -f "$DMG_PATH" ]; then
    echo -e "${YELLOW}🗑️  Removing old DMG: $DMG_PATH${NC}"
    rm "$DMG_PATH"
fi

# Create DMG
echo -e "${GREEN}📦 Creating DMG: $DMG_NAME${NC}"

# Try with full positioning first
if create-dmg \
    --volname "$APP_NAME" \
    --volicon "static/images/logo.icns" \
    --window-pos 200 120 \
    --window-size 600 400 \
    --icon-size 100 \
    --icon "$APP_NAME" 175 120 \
    --hide-extension "$APP_NAME" \
    --app-drop-link 425 120 \
    --no-internet-enable \
    --skip-jenkins \
    "$DMG_PATH" \
    "$APP_PATH"; then
    echo -e "${GREEN}✅ DMG created with full positioning${NC}"
else
    echo -e "${YELLOW}⚠️  Full positioning failed, trying minimal positioning...${NC}"
    
    # Fallback: minimal positioning
    if create-dmg \
        --volname "$APP_NAME" \
        --volicon "static/images/logo.icns" \
        --window-size 600 400 \
        --icon-size 100 \
        --hide-extension "$APP_NAME" \
        --no-internet-enable \
        --skip-jenkins \
        "$DMG_PATH" \
        "$APP_PATH"; then
        echo -e "${GREEN}✅ DMG created with minimal positioning${NC}"
    else
        echo -e "${RED}❌ DMG creation failed completely${NC}"
        exit 1
    fi
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ DMG created successfully: $DMG_PATH${NC}"
    echo -e "${GREEN}📁 Size: $(du -h "$DMG_PATH" | cut -f1)${NC}"
    echo -e "${GREEN}🎯 You can now distribute this DMG file!${NC}"
else
    echo -e "${RED}❌ Failed to create DMG${NC}"
    exit 1
fi
