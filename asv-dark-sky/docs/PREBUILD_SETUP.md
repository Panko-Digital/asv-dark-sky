# Expo Prebuild Setup

## Overview
This project uses Expo's managed workflow with prebuild. The `ios/` and `android/` folders are **generated automatically** and should NOT be committed to the repository.

## Why Not Commit Native Folders?

1. **Security**: API keys and sensitive configuration get injected during prebuild
2. **Simplicity**: No need to manually manage native code changes
3. **Consistency**: Each developer generates their own native code with their own credentials
4. **Clean Git History**: No noise from generated code changes

## Setup Instructions

### First Time Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd asv-dark-sky
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your `.env` file**
   ```bash
   cp .env.example .env
   # Edit .env and add your own API keys
   ```

4. **Run prebuild to generate native folders**
   ```bash
   npx expo prebuild
   ```

5. **Install iOS dependencies**
   ```bash
   cd ios && pod install && cd ..
   ```

6. **Run the app**
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

### Environment Variables Required

Create a `.env` file in the root directory with:

```env
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=your_ios_api_key_here
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=your_android_api_key_here
```

### When to Run Prebuild

Run `npx expo prebuild` when:
- First setting up the project
- After adding new native dependencies
- After updating `app.config.js` with new native configuration
- If you delete the `ios/` or `android/` folders

### What's Ignored in Git

The following are generated and ignored:
- `ios/` - entire iOS native folder
- `android/` - entire Android native folder
- `.env` - environment variables with secrets
- `.expo/` - Expo build cache

### CI/CD Setup

For CI/CD pipelines, add these steps:
1. Set environment variables in your CI system
2. Run `npx expo prebuild` before building
3. Build the app normally

### Troubleshooting

**Problem**: App crashes with "Google Maps API key not found"
- **Solution**: Make sure your `.env` file exists and contains the API keys

**Problem**: Native modules not found
- **Solution**: Run `npx expo prebuild` to regenerate native folders

**Problem**: Build errors after pulling changes
- **Solution**: Delete `ios/` and `android/`, run `npx expo prebuild`, then rebuild

## Important Notes

⚠️ **Never commit the `ios/` or `android/` folders!**
⚠️ **Never commit your `.env` file!**
⚠️ **Each developer needs their own Google Maps API keys**

## Getting Google Maps API Keys

See `GOOGLE_MAPS_SETUP.md` for instructions on creating your own API keys.
