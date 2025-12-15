# Google Maps API Setup Guide

## 🔐 Secure API Key Management (RECOMMENDED)

This project uses environment variables to keep your API keys secure and out of version control.

### Setup Steps:

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your API keys to `.env`:**
   ```bash
   EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=AIzaSy...your_ios_key
   EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=AIzaSy...your_android_key
   ```

3. **The `.env` file is already in `.gitignore`** - your keys won't be committed!

4. **Configuration is handled automatically** by `app.config.js`

### Important Files:
- ✅ `.env` - Your actual API keys (NEVER commit this!)
- ✅ `.env.example` - Template for other developers
- ✅ `app.config.js` - Reads env vars and injects them into the app
- ✅ `.gitignore` - Ensures `.env` is never committed

## 1. Get Google Maps API Keys

### Go to Google Cloud Console
1. Visit: https://console.cloud.google.com/
2. Select your project: `popkorn-472305`

### Enable Required APIs
1. Go to **APIs & Services** > **Enable APIs and Services**
2. Search for and enable:
   - **Maps SDK for iOS**
   - **Maps SDK for Android**

### Create API Keys
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**

#### For iOS:
- Create an API key
- Click **Edit API Key**
- Under "API restrictions", select "Restrict key"
- Check **Maps SDK for iOS**
- Under "Application restrictions", select "iOS apps"
- Add your bundle ID: `com.stesmi99.asvdarksky`
- Save

#### For Android:
- Create a separate API key
- Click **Edit API Key**
- Under "API restrictions", select "Restrict key"
- Check **Maps SDK for Android**
- Under "Application restrictions", select "Android apps"
- Add your package name: `com.stesmi99.asvdarksky`
- Add your SHA-1 certificate fingerprint (see below)
- Save

### Get Android SHA-1 Fingerprint

For development/debug builds:
```bash
cd android
./gradlew signingReport
```

Look for the "SHA1" under "Variant: debug" section.

Alternatively, use keytool:
```bash
# For debug keystore (development)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# For release keystore (production)
keytool -list -v -keystore /path/to/your/release.keystore -alias your-key-alias
```

## 2. Add API Keys to app.json

~~Open `app.json` and replace the placeholder values~~

**✅ No longer needed!** API keys are now managed via `.env` file (see above).

## 3. Rebuild Your App

### For iOS:
```bash
npx expo run:ios
```

### For Android:
```bash
npx expo run:android
```

### For EAS Build:
```bash
eas build --platform ios
eas build --platform android
```

## 4. Verify It Works

1. Launch the app
2. Navigate to the "Map" tab
3. You should see a Google Map with dark styling
4. If you have measurements with GPS data, they'll appear as colored markers

## Troubleshooting

### iOS shows blank map:
- Verify API key is correct in `app.json`
- Check that Maps SDK for iOS is enabled
- Rebuild the app completely: `npx expo run:ios`

### Android shows blank map:
- Verify API key is correct in `app.json`
- Verify SHA-1 fingerprint is added to the API key restrictions
- Check that Maps SDK for Android is enabled
- Rebuild the app completely: `npx expo run:android`

### "Google Maps API error: API key not found":
- Make sure you've added the keys to `app.json` (not `package.json`)
- Rebuild the app after making changes

## Optional: Use One API Key for Both Platforms (Less Secure)

If you want to use the same key for development:
1. Create one API key without restrictions
2. Use it for both iOS and Android
3. **Note:** This is less secure and not recommended for production

## Cost Information

- Google Maps Platform offers **$200 free credit per month**
- Mobile maps usage is typically well within the free tier for small apps
- Monitor usage at: https://console.cloud.google.com/google/maps-apis/metrics

## Current Configuration Status

- ✅ Backend endpoint deployed: `get_measurements`
- ✅ MapScreen implemented with dark theme
- ✅ Environment variables configured (`.env` file)
- ✅ API keys secured (not in version control)
- ✅ `app.config.js` handles key injection automatically
- ⏳ **TODO:** Add your actual Google Maps API keys to `.env`
- ⏳ **TODO:** Rebuild app with `npx expo run:ios` and `npx expo run:android`

## For EAS Build / Production

When building with EAS, you need to set environment variables in EAS:

```bash
# Set secrets for EAS builds
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY --value "your_ios_key" --type string
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY --value "your_android_key" --type string
```

Or add them to `eas.json`:
```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY": "your_ios_key",
        "EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY": "your_android_key"
      }
    }
  }
}
```

**Note:** Be cautious with committing `eas.json` if it contains keys!

