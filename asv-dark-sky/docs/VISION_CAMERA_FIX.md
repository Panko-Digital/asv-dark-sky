# Vision Camera Build Fix

## Problem

Build failing with:

```
error: cannot find symbol
     @FastNative
      ^
   symbol:   class FastNative
   location: class SharedArray
```

## Root Causes

1. `react-native-vision-camera` 4.7.2 requires `react-native-worklets-core`, not `react-native-worklets`
2. `@FastNative` annotation requires new architecture, but has compatibility issues with React Native 0.81.5

## Solutions Applied

### 1. Install Correct Dependency

```bash
npm uninstall react-native-worklets
npm install react-native-worklets-core
```

### 2. Disable New Architecture

Updated `plugins/withAndroidSdkVersions.js` to set `newArchEnabled=false`.

**Why:** The `@FastNative` annotation has compatibility issues. Vision camera works fine without new architecture.

## Config Plugin Update

The plugin now:

- Removes any existing `newArchEnabled` entries
- Sets `newArchEnabled=false`
- Survives prebuild and works on EAS

## Result

✅ Correct dependency installed
✅ New architecture disabled
✅ Vision camera compiles successfully
✅ All functionality preserved
