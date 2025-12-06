#!/bin/bash
# Helper script for local Android builds with Mapbox token

# Load MAPBOX_DOWNLOADS_TOKEN from .env file
export MAPBOX_DOWNLOADS_TOKEN=$(grep MAPBOX_DOWNLOADS_TOKEN .env | cut -d '=' -f2 | cut -d '#' -f1 | xargs)

if [ -z "$MAPBOX_DOWNLOADS_TOKEN" ]; then
  echo "❌ Error: MAPBOX_DOWNLOADS_TOKEN not found in .env file"
  exit 1
fi

echo "✅ MAPBOX_DOWNLOADS_TOKEN loaded"
echo "🔨 Building Android app..."

cd android
./gradlew assembleRelease

echo "✅ Build complete!"
