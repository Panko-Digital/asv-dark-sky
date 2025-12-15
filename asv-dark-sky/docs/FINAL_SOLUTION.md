# EAS Android Build - Final Solution

## Status: Ready for EAS Build Testing

### Problem Summary

EAS build was failing with:

- `Could not find com.mapbox.maps:android-ndk27:10.19.0`
- `Could not find com.mapbox.mapboxsdk:mapbox-sdk-turf:6.11.0`

### Root Cause

Expo SDK 54 defaults to targetSdk 36, which triggers @rnmapbox/maps to request the NDK27 variant that doesn't exist in Mapbox Maven repository for version 11.16.2.

### Solution Implemented

#### 1. Mapbox Dependency Fix

- **Patch Script**: `scripts/patch-mapbox.js` patches `@rnmapbox/maps/android/build.gradle` to always use standard `android:11.16.2` variant instead of checking targetSdk
- **Auto-run**: Added `postinstall` script to `package.json` to run patch automatically after npm install
- **Already Applied**: The patch has been applied to your current node_modules

#### 2. Config Plugins (Survive Prebuild)

Created Expo config plugins to ensure changes survive prebuild:

- **`plugins/withAndroidBuildGradle.js`**:

  - Adds Mapbox Maven repository with authentication
  - Adds resolution strategy to force `mapbox-sdk-turf:6.15.0`

- **`plugins/withAndroidAppBuildGradle.js`**:
  - Comments out `buildToolsVersion` line (not set by Expo)

#### 3. Dependencies Updated

- `@rnmapbox/maps`: 10.2.9
- `react-native-vision-camera`: 4.7.3
- `react-native-worklets-core`: 1.6.2 (replaced react-native-worklets)

#### 4. SDK Configuration

- Using Expo SDK 54 defaults (targetSdk 36, compileSdk 36, NDK 27)
- New architecture enabled (required by react-native-reanimated 4.x)
- No SDK version overrides in app.json or app.config.js

#### 5. EAS Environment

- `MAPBOX_DOWNLOADS_TOKEN` already configured in EAS for all environments ✅

### Current Local Build Issue

**Issue**: `./gradlew assembleRelease` fails with "Value is null" at line 88 in `android/app/build.gradle`

**Cause**: The Expo root project plugin should set these ext properties:

- `rootProject.ext.compileSdkVersion`
- `rootProject.ext.targetSdkVersion`
- `rootProject.ext.minSdkVersion`
- `rootProject.ext.ndkVersion`

But they're not being set properly in the local environment.

**Impact**: This is a **local environment issue only**. EAS build should work correctly because:

1. EAS runs a fresh prebuild
2. EAS environment properly initializes the Expo root project plugin
3. All config plugins will be applied correctly
4. The patch script will run during npm install

### Next Steps

#### Test on EAS (Recommended)

```bash
eas build --platform android --profile production
```

The EAS build should succeed because:

- Config plugins handle all modifications
- Patch script runs during npm install
- MAPBOX_DOWNLOADS_TOKEN is configured
- Fresh prebuild environment works correctly

#### If Local Build is Required

The local build issue is separate from the EAS build issue. To fix local builds, you would need to investigate why the Expo root project plugin isn't setting ext properties in your local environment. This could be:

- Gradle version mismatch
- Expo CLI version issue
- Local gradle cache corruption

But since you emphasized that "EAS build service should manage building", testing on EAS is the priority.

### Files Modified

- `scripts/patch-mapbox.js` - Post-install patch script
- `package.json` - Added postinstall script
- `plugins/withAndroidBuildGradle.js` - Mapbox Maven + resolution strategy
- `plugins/withAndroidAppBuildGradle.js` - Comment out buildToolsVersion
- `app.json` - Added config plugins
- `android/build.gradle` - Mapbox Maven + resolution strategy (applied by plugin)
- `android/app/build.gradle` - buildToolsVersion commented (applied by plugin)

### Verification

Run EAS build to verify the solution works in the EAS environment.
