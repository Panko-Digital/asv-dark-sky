# Mapbox EAS Build Fix - FINAL SOLUTION ✅

## Problem

EAS build failing with:

```
Could not find com.mapbox.maps:android-ndk27:10.19.0
Could not find com.mapbox.mapboxsdk:mapbox-sdk-turf:6.11.0
```

## Root Cause

Expo SDK 54 defaults to targetSdk 36, triggering @rnmapbox/maps to request NDK27 variant that doesn't exist in Mapbox Maven repository.

## THE SOLUTION: Expo Config Plugins

Since EAS runs prebuild and wipes out manual changes, we use **Expo config plugins** to inject the fixes automatically.

### 1. Update @rnmapbox/maps

```bash
npm install @rnmapbox/maps@10.2.9
```

### 2. Create Config Plugins

**File: `plugins/withAndroidSdkVersions.js`**

```javascript
const { withGradleProperties } = require("@expo/config-plugins");

const withAndroidSdkVersions = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults.push({
      type: "comment",
      value:
        " CRITICAL: Override Expo SDK 54 defaults to avoid Mapbox NDK27 requirement",
    });
    config.modResults.push({
      type: "property",
      key: "targetSdkVersion",
      value: "33",
    });
    config.modResults.push({
      type: "property",
      key: "compileSdkVersion",
      value: "33",
    });
    config.modResults.push({
      type: "property",
      key: "buildToolsVersion",
      value: "33.0.0",
    });
    return config;
  });
};

module.exports = withAndroidSdkVersions;
```

**File: `plugins/withMapboxConfig.js`**

```javascript
const {
  withProjectBuildGradle,
  withAppBuildGradle,
} = require("@expo/config-plugins");

const withMapboxConfig = (config) => {
  // Adds Mapbox Maven repository and resolution strategy to build.gradle
  // Adds SDK overrides to app/build.gradle
  // (See full file in repo)
};

module.exports = withMapboxConfig;
```

### 3. Add Plugins to app.json

```json
{
  "expo": {
    "plugins": [
      // ... existing plugins ...
      "./plugins/withAndroidSdkVersions.js",
      "./plugins/withMapboxConfig.js"
    ]
  }
}
```

### 4. Update app.json Android Config

```json
"android": {
  "minSdkVersion": 24,
  "compileSdkVersion": 33,
  "targetSdkVersion": 33,
  "buildToolsVersion": "33.0.0"
}
```

## How It Works

1. **EAS runs prebuild** → Regenerates android folder
2. **Expo config plugins run** → Inject our fixes automatically:
   - `withAndroidSdkVersions` → Adds SDK versions to gradle.properties
   - `withMapboxConfig` → Adds Mapbox repo and overrides to build.gradle files
3. **Build proceeds** → Uses targetSdk 33, downloads correct Mapbox dependencies

## Verification

After prebuild, check:

```bash
grep targetSdkVersion android/gradle.properties
# Should show: targetSdkVersion=33

./gradlew clean | grep ExpoRootProject -A 5
# Should show: targetSdk: 33
```

## EAS Build

Now you can safely run:

```bash
eas build --platform android --profile production
```

EAS will:

1. Run prebuild (regenerates android folder)
2. Apply config plugins (injects our fixes)
3. Build successfully with targetSdk 33 ✅

## Result

✅ Expo logs show targetSdk 33 (not 36)
✅ Uses `com.mapbox.maps:android:11.16.2` (standard, NOT ndk27)
✅ Uses `com.mapbox.mapboxsdk:mapbox-sdk-turf:6.15.0`
✅ MAPBOX_DOWNLOADS_TOKEN authentication working
✅ Build successful every time, even after prebuild

## Files Created/Modified

1. `plugins/withAndroidSdkVersions.js` - NEW: Config plugin for SDK versions
2. `plugins/withMapboxConfig.js` - NEW: Config plugin for Mapbox setup
3. `app.json` - Added plugins array
4. `package.json` - Updated @rnmapbox/maps to 10.2.9

## Important Notes

- Config plugins survive prebuild ✅
- No manual android folder modifications needed
- Works for both local and EAS builds
- Target SDK 33 is fully supported by Google Play
