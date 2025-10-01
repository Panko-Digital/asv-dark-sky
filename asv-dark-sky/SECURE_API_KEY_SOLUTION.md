# Secure API Key Management - Final Solution

## ✅ Problem Solved

**Issue:** API key was hardcoded in `Info.plist`, which would be committed to git
**Solution:** Using environment variables loaded from `.env` file at build time

## How It Works

### 1. **API Key in `.env` (Git-Ignored)**
```bash
EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=your_key_here
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=your_key_here
```

### 2. **Info.plist Uses Variable**
```xml
<key>GoogleMapsApiKey</key>
<string>$(GOOGLE_MAPS_API_KEY_IOS)</string>
```

### 3. **Podfile Loads .env**
The `Podfile` reads the `.env` file and sets the environment variable:
```ruby
def load_env_variables
  env_file = File.join(__dir__, '../.env')
  if File.exist?(env_file)
    File.readlines(env_file).each do |line|
      if key == 'EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY'
        ENV['GOOGLE_MAPS_API_KEY_IOS'] = value
      end
    end
  end
end
```

### 4. **Xcode Loads Variables**
The `ios/.xcode.env.local` file loads environment variables during Xcode build:
```bash
# Parse .env and export variables
while IFS='=' read -r key value; do
  export "$key=$value"
done < "$PODS_ROOT/../.env"

# Export for Info.plist substitution
export GOOGLE_MAPS_API_KEY_IOS="$EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY"
```

## File Structure

```
asv-dark-sky/
├── .env                          ← API keys (GIT-IGNORED) ✅
├── .env.example                  ← Template (safe to commit) ✅
├── app.config.js                 ← Reads from .env
├── ios/
│   ├── .xcode.env.local          ← Loads .env for Xcode (GIT-IGNORED) ⚠️
│   ├── .gitignore                ← Excludes Config.xcconfig
│   ├── Podfile                   ← Loads .env variables
│   └── asvdarksky/
│       └── Info.plist            ← Uses $(GOOGLE_MAPS_API_KEY_IOS) ✅
└── .gitignore                    ← Excludes .env ✅
```

## What Gets Committed

✅ **Safe to commit:**
- `Info.plist` with `$(GOOGLE_MAPS_API_KEY_IOS)` variable
- `.env.example` template
- `Podfile` with env loading logic
- `app.config.js` with env variable references

❌ **Never commit:**
- `.env` (contains actual API keys)
- `ios/.xcode.env.local` (may contain local paths and secrets)
- `ios/Config.xcconfig` (if generated)

## Security Benefits

✅ **API keys never in git history**
✅ **Each developer uses their own keys**
✅ **Production/staging use different keys**
✅ **Easy to rotate keys without code changes**
✅ **CI/CD can inject keys as secrets**

## Verification

Check what will be committed:
```bash
cd /Users/stevensmith/Documents/Repos/asvgeelong-sqm/CameraApp/asv-dark-sky
git status
git diff ios/asvdarksky/Info.plist
```

You should see:
- `Info.plist` shows `$(GOOGLE_MAPS_API_KEY_IOS)` (variable, not actual key) ✅
- `.env` does NOT appear in git status ✅

## Build Process

### Development Build
```bash
npx expo run:ios
# ↓
# 1. Podfile reads .env and sets ENV['GOOGLE_MAPS_API_KEY_IOS']
# 2. Xcode reads .xcode.env.local and loads GOOGLE_MAPS_API_KEY_IOS
# 3. Info.plist variable $(GOOGLE_MAPS_API_KEY_IOS) is substituted
# 4. AppDelegate reads GoogleMapsApiKey from Info.plist
# 5. GMSServices.provideAPIKey() is called with the key
```

### EAS Build (Production)
```bash
# Set secrets in EAS
eas secret:create --scope project \
  --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY \
  --value "your_production_key"

# Build uses the secret
eas build --platform ios
```

## Troubleshooting

### Build fails: "GoogleMapsApiKey not found"
- Check `.env` file exists
- Check `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` is set in `.env`
- Verify `.xcode.env.local` has the env loading code

### Map shows blank
- Check Google Cloud Console: Maps SDK for iOS enabled
- Check API key restrictions: bundle ID matches `com.stesmi99.asvdarksky`
- Rebuild: `npx expo run:ios`

## For Team Members

When cloning the repo:
1. Copy `.env.example` to `.env`
2. Add your API keys to `.env`
3. Run `npx expo run:ios`

## Clean Up Done

Removed unnecessary files:
- ✅ `ios/scripts/inject-api-keys.sh` (not needed)
- ✅ `ios/scripts/build-inject-keys.sh` (not needed)
- ✅ `ios/Config.xcconfig.template` (not needed)

Final solution uses:
- ✅ `Podfile` to load env vars
- ✅ `.xcode.env.local` for Xcode builds
- ✅ Variable substitution in `Info.plist`

## Summary

🔒 **Secure:** API keys never committed to git
🚀 **Simple:** Standard Xcode environment variable substitution
👥 **Team-friendly:** Each developer manages their own keys
🏭 **Production-ready:** Works with EAS secrets for production builds
