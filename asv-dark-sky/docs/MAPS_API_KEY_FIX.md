# Google Maps API Key - Final Solution

## Problem
The app was crashing on MapScreen launch with `GMSServices` error because the API key wasn't being properly initialized.

## Root Cause
When using `npx expo prebuild`, Expo was hardcoding the API key directly into:
1. `Info.plist` - hardcoded value
2. `AppDelegate.swift` - hardcoded value in `GMSServices.provideAPIKey()`

This meant the sensitive API key was being written to tracked files, which would be committed to the repository - a major security risk.

## Solution
Modified `AppDelegate.swift` to read the API key from environment variables at runtime instead of using hardcoded values:

```swift
// Read API key from environment variable instead of hardcoding
if let apiKey = ProcessInfo.processInfo.environment["GOOGLE_MAPS_API_KEY_IOS"] {
  GMSServices.provideAPIKey(apiKey)
} else if let apiKey = Bundle.main.object(forInfoDictionaryKey: "GoogleMapsApiKey") as? String {
  // Fallback to Info.plist if env var not available
  GMSServices.provideAPIKey(apiKey)
} else {
  print("Warning: Google Maps API key not found in environment or Info.plist")
}
```

## How It Works
1. **Build Time**: `ios/.xcode.env.local` reads from `.env` and exports `GOOGLE_MAPS_API_KEY_IOS`
2. **Runtime**: `AppDelegate.swift` reads from `ProcessInfo.processInfo.environment["GOOGLE_MAPS_API_KEY_IOS"]`
3. **Fallback**: If env var not available, reads from `Info.plist` (which now has placeholder value)

## Security Benefits
- ✅ No hardcoded API keys in tracked files
- ✅ API key stored in `.env` file (git-ignored)
- ✅ Safe to commit `Info.plist` and `AppDelegate.swift`
- ✅ Each developer can have their own API key
- ✅ CI/CD can inject keys at build time

## Files Modified
1. `ios/asvdarksky/AppDelegate.swift` - Reads from environment
2. `ios/asvdarksky/Info.plist` - Uses placeholder `$(GOOGLE_MAPS_API_KEY_IOS)`
3. `ios/.xcode.env.local` - Exports environment variable from `.env`

## Important Notes
- After running `npx expo prebuild`, always check that no hardcoded keys were written
- The `.xcode.env.local` script runs during Xcode build to make env vars available
- Environment variables are available via `ProcessInfo.processInfo.environment` in Swift
