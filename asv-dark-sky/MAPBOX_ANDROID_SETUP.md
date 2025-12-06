# Mapbox Android Build Fix

## Issue
EAS Android builds were failing with:
```
Could not find com.mapbox.maps:android-ndk27:10.19.0
```

## Root Cause
Mapbox requires:
1. The Mapbox Maven repository to be configured in `android/settings.gradle` (Gradle 8+)
2. A Mapbox access token with `DOWNLOADS:READ` scope for authentication

**Important**: In Gradle 8+, repositories declared in `allprojects` are ignored. Repositories must be declared in `settings.gradle` using `dependencyResolutionManagement`.

## Solution Applied

### 1. Added Mapbox Maven Repository to settings.gradle
Updated `android/settings.gradle` to include the Mapbox Maven repository in the `dependencyResolutionManagement` block with authentication.

### 2. Configured Token Access
Updated `android/gradle.properties` to read `MAPBOX_DOWNLOADS_TOKEN` from environment variables.
The token is read from:
- Gradle properties: `MAPBOX_DOWNLOADS_TOKEN` in `gradle.properties`
- Environment variable: `MAPBOX_DOWNLOADS_TOKEN` (for EAS builds)

## Setup Required

### Get Your Mapbox Download Token

1. **Go to Mapbox Account**: https://account.mapbox.com/access-tokens/
2. **Create a new token** (or use an existing one)
3. **Ensure the token has `DOWNLOADS:READ` scope**
   - This scope is required to download Mapbox SDK dependencies from their Maven repository

### For Local Development

Add to your `.env` file:
```env
MAPBOX_DOWNLOADS_TOKEN=your_mapbox_token_here
```

### For EAS Builds

Add the token as an EAS environment variable:
```bash
eas env:create --scope project --name MAPBOX_DOWNLOADS_TOKEN --value YOUR_MAPBOX_TOKEN --type string
```

Verify it was added:
```bash
eas env:list
```

## How It Works

1. **Local Development**: 
   - `.env` file provides `MAPBOX_DOWNLOADS_TOKEN`
   - `gradle.properties` reads it via `${MAPBOX_DOWNLOADS_TOKEN}`
   - Gradle uses it to authenticate with Mapbox Maven repository

2. **EAS Builds**:
   - EAS environment variable `MAPBOX_DOWNLOADS_TOKEN` is available during build
   - `gradle.properties` reads it during build
   - Gradle authenticates and downloads Mapbox dependencies

## Verification

After setting up the token, try building:
```bash
# Local build
npx expo run:android

# EAS build
eas build --platform android
```

The build should now successfully download Mapbox dependencies.

## Important Notes

- **Token Scope**: The token MUST have `DOWNLOADS:READ` scope
- **Username**: Always use `mapbox` as the username (not your Mapbox username)
- **Security**: Never commit your Mapbox token to version control
- **Token Type**: Use a **secret token** (not a public token) for downloads

## Troubleshooting

### Build still fails with "Could not find com.mapbox.maps"
- Verify token has `DOWNLOADS:READ` scope
- Check token is set correctly in `.env` (local) or EAS environment variables (cloud)
- Try clearing Gradle cache: `cd android && ./gradlew clean`

### Authentication error
- Verify token is valid and not expired
- Check token has correct scope
- Ensure username in `build.gradle` is exactly `mapbox` (lowercase)

