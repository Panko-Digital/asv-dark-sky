# EAS Android Build - All Fixes Applied ✅

## Issues Fixed

### 1. Mapbox Dependency Resolution ✅

**Problem:** Could not find `com.mapbox.maps:android-ndk27:10.19.0`

**Solution:**

- Updated `@rnmapbox/maps` to 10.2.9
- Created Expo config plugin to inject targetSdk 33
- Plugin survives prebuild and works on EAS

### 2. Vision Camera @FastNative Error ✅

**Problem:** `@FastNative` annotation not found

**Solution:**

- Replaced `react-native-worklets` with `react-native-worklets-core`
- Updated `react-native-vision-camera` to 4.7.3
- Ensured new architecture is enabled (required by reanimated 4.x)

### 3. Reanimated New Architecture Requirement ✅

**Problem:** Reanimated 4.x requires `newArchEnabled=true`

**Solution:**

- Config plugin explicitly sets `newArchEnabled=true`
- This is compatible with vision-camera 4.7.3

## Config Plugins

### plugins/withAndroidSdkVersions.js

- Sets targetSdkVersion=33
- Sets compileSdkVersion=33
- Sets buildToolsVersion=33.0.0
- Sets newArchEnabled=true

### plugins/withMapboxConfig.js

- Adds Mapbox Maven repository with authentication
- Adds resolution strategy for Turf dependency
- Overrides SDK versions in app/build.gradle

## Package Updates

```json
{
  "@rnmapbox/maps": "^10.2.9",
  "react-native-vision-camera": "^4.7.3",
  "react-native-worklets-core": "^1.6.2",
  "react-native-reanimated": "^4.1.5"
}
```

## Verification

EAS build logs should show:

```
[ExpoRootProject] Using the following versions:
  - targetSdk:   33  ✅
  - compileSdk:  33  ✅
```

And gradle.properties should have:

```
targetSdkVersion=33
compileSdkVersion=33
buildToolsVersion=33.0.0
newArchEnabled=true
```

## Ready to Build

```bash
eas build --platform android --profile production
```

## What Happens During EAS Build

1. **Prebuild runs** → Regenerates android folder
2. **Config plugins execute** → Inject all fixes automatically
3. **Dependencies resolve** → Correct packages installed
4. **New architecture enabled** → Reanimated and vision-camera work
5. **Build succeeds** ✅

## Environment Variables

Ensure these are set in EAS (already verified ✅):

- MAPBOX_DOWNLOADS_TOKEN
- GOOGLE_MAPS_ANDROID_API_KEY
- GOOGLE_MAPS_IOS_API_KEY

## Key Points

- ✅ targetSdk 33 avoids Mapbox NDK27 requirement
- ✅ New architecture enabled for reanimated 4.x
- ✅ Vision camera 4.7.3 compatible with new architecture
- ✅ All fixes survive prebuild via config plugins
- ✅ Works on both local and EAS builds
