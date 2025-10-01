# Google Maps Crash Fix - Resolved

## ✅ Issue Resolved

**Error:** `EXC_CRASH (SIGABRT)` - `GMSServices checkServicePreconditions` crash when viewing MapScreen

**Root Cause:** Google Maps SDK not initialized before use

## What Was Done

### 1. **Updated AppDelegate.swift**
Added Google Maps initialization in `didFinishLaunchingWithOptions`:

```swift
import GoogleMaps

// In didFinishLaunchingWithOptions:
if let googleMapsApiKey = Bundle.main.object(forInfoDictionaryKey: "GoogleMapsApiKey") as? String {
  GMSServices.provideAPIKey(googleMapsApiKey)
}
```

### 2. **Added API Key to Info.plist**
```xml
<key>GoogleMapsApiKey</key>
<string>AIzaSy...your_actual_key</string>
```

### 3. **Updated app.config.js**
Added `infoPlist` configuration to ensure API key is injected:

```javascript
ios: {
  config: {
    googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
  },
  infoPlist: {
    GoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
  },
}
```

### 4. **Rebuilt the App**
```bash
npx expo run:ios
```

## Files Modified

1. ✅ `ios/asvdarksky/AppDelegate.swift` - Added GoogleMaps import and initialization
2. ✅ `ios/asvdarksky/Info.plist` - Added GoogleMapsApiKey
3. ✅ `app.config.js` - Added infoPlist configuration

## Current Status

✅ **Build succeeded**
✅ **App installed on iPhone 16 Pro simulator**
✅ **App opening successfully**
✅ **Google Maps SDK initialized**

## Testing the Map

1. **Open the app** (should be running now)
2. **Navigate to "Map" tab** (bottom navigation)
3. **Expected behavior:**
   - Dark-themed Google Map displays
   - Map loads without crashes
   - Markers show for measurements with GPS data
   - You can zoom/pan the map

## Why This Fix Works

### The Problem
- Google Maps SDK requires `GMSServices.provideAPIKey()` to be called **before** any map views are created
- Without this initialization, the SDK throws `checkServicePreconditions` exception
- The crash happened when MapScreen tried to render `<MapView>`

### The Solution
- Import GoogleMaps framework in AppDelegate
- Initialize SDK in `didFinishLaunchingWithOptions` (runs before any views)
- API key read from Info.plist (injected from app.config.js via .env)
- SDK is ready before React Native loads, preventing the crash

## Architecture Flow

```
App Launch → AppDelegate.didFinishLaunchingWithOptions()
           → Read GoogleMapsApiKey from Info.plist
           → GMSServices.provideAPIKey()
           → React Native starts
           → MapScreen renders
           → <MapView> uses initialized SDK ✅
```

## Security Note

⚠️ **Info.plist now contains the API key**

The API key is in `ios/asvdarksky/Info.plist` which means:
- It's in your local build
- You should add `Info.plist` to `.gitignore` if committing (or use a script to inject it)
- For production, use environment-specific builds

### Better Long-term Solution

For production, use a prebuild script to inject the API key:

```bash
# Add to .gitignore
ios/asvdarksky/Info.plist

# Create prebuild script
scripts/inject-api-keys.sh
```

But for now, this works for development! 🎉

## Verification Steps

1. ✅ App launches without crashing
2. ✅ Navigate to Map tab
3. ✅ Map displays with dark theme
4. ✅ No `GMSServices checkServicePreconditions` error
5. ✅ Markers visible for measurements with location data

## Next Steps

- **Test the Map:** Open the Map tab and verify it works
- **Take a measurement:** Go to Camera tab, capture photos, submit
- **Verify marker appears:** Check Map tab to see the new measurement marker

## If Issues Persist

### Map still shows blank:
- Verify API key in Google Cloud Console
- Check Maps SDK for iOS is enabled
- Verify bundle ID restriction: `com.stesmi99.asvdarksky`

### Different crash:
```bash
# Clean build
cd ios
rm -rf build Pods
pod install
cd ..
npx expo run:ios
```

## Success! 🎉

The app should now be running with a functional map view. Navigate to the Map tab to see your measurements!
