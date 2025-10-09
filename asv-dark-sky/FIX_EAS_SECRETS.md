# Fix EAS Secrets - Remove EXPO_PUBLIC_ Prefix

## The Problem
Environment variables with `EXPO_PUBLIC_` prefix are embedded in the JavaScript bundle and exposed to clients. This is NOT secure for API keys!

## The Solution
Use non-prefixed environment variable names that are only available at build-time in `app.config.js`.

---

## Steps to Fix

### 1. Delete the incorrectly named secrets from EAS

```bash
eas secret:delete --name EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY
eas secret:delete --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY
```

### 2. Create new secrets with correct names (no EXPO_PUBLIC_ prefix)

```bash
# Add Android Google Maps API key (build-time secret)
eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value YOUR_ANDROID_API_KEY --type string

# Add iOS Google Maps API key (build-time secret)
eas secret:create --scope project --name GOOGLE_MAPS_IOS_API_KEY --value YOUR_IOS_API_KEY --type string
```

### 3. Verify secrets are configured correctly

```bash
eas secret:list
```

You should see:
- `GOOGLE_MAPS_ANDROID_API_KEY`
- `GOOGLE_MAPS_IOS_API_KEY`

### 4. Build your app

```bash
eas build --platform android
```

---

## What Changed

### ✅ Updated Files

1. **`.env`** - Renamed variables (for local development)
   - `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` → `GOOGLE_MAPS_ANDROID_API_KEY`
   - `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` → `GOOGLE_MAPS_IOS_API_KEY`

2. **`app.config.js`** - Updated to read from new variable names
   - Now reads `process.env.GOOGLE_MAPS_ANDROID_API_KEY`
   - Now reads `process.env.GOOGLE_MAPS_IOS_API_KEY`

3. **`EAS_ENVIRONMENT_VARIABLES.md`** - Updated documentation

### ✅ Verification

Run `node test-config.js` to verify the configuration is working locally:
- Environment variables load correctly from `.env`
- `app.config.js` properly injects them into Android/iOS config

---

## Why This Matters

### ❌ EXPO_PUBLIC_ prefix (BAD for secrets)
- Variables are embedded in JavaScript bundle
- Visible to anyone who decompiles your app
- Exposed in client code
- Anyone can extract and use your API keys

### ✅ No prefix (GOOD for build-time secrets)
- Variables only available during build
- Baked into native Android/iOS configuration
- NOT accessible from JavaScript runtime
- NOT visible in compiled bundle
- Keys are safely embedded in native code only

---

## How It Works Now

1. **Local Development**: `.env` file provides keys
2. **EAS Build**: EAS secrets provide keys as environment variables
3. **Build Time**: `app.config.js` runs and injects keys into native config
4. **Runtime**: Native map components use keys from native config
5. **Security**: Keys never exposed in JavaScript bundle

---

## Next Steps

1. ✅ Run the delete commands above
2. ✅ Run the create commands above  
3. ✅ Verify with `eas secret:list`
4. ✅ Build: `eas build --platform android`
5. ✅ MapScreen will work and keys will be secure!

