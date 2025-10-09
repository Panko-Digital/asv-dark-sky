# Adding Environment Variables to EAS Build

## Why You Need This
EAS builds run on Expo's cloud servers, so they don't have access to your local `.env` file. You need to provide the environment variables to EAS.

## ⚠️ Important: Don't Use EXPO_PUBLIC_ for Secrets

**DO NOT** prefix API keys with `EXPO_PUBLIC_` - this makes them visible in your compiled JavaScript bundle!

- ❌ `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Exposed in client bundle
- ✅ `GOOGLE_MAPS_API_KEY` - Build-time only, not exposed

## Option 1: Using EAS Secrets (Recommended - Most Secure)

Add your Google Maps API keys as EAS secrets using the CLI:

```bash
# Add Android Google Maps API key
eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value YOUR_ANDROID_API_KEY --type string

# Add iOS Google Maps API key
eas secret:create --scope project --name GOOGLE_MAPS_IOS_API_KEY --value YOUR_IOS_API_KEY --type string
```

### If you already added them with EXPO_PUBLIC_ prefix, delete them first:
```bash
eas secret:delete --name EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY
eas secret:delete --name EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY
```

### Verify secrets were added:
```bash
eas secret:list
```

### Benefits:
✅ Secrets are encrypted and stored securely on Expo's servers
✅ Not visible in build logs
✅ Not committed to version control
✅ Can be different per environment (production, preview, development)
✅ Automatically available during EAS builds

---

## Option 2: Using eas.json Environment Variables (Less Secure)

Add environment variables directly to `eas.json`:

⚠️ **WARNING**: These values will be visible in build logs and could be exposed if eas.json is committed to public repo.

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "env": {
        "GOOGLE_MAPS_ANDROID_API_KEY": "YOUR_ANDROID_API_KEY",
        "GOOGLE_MAPS_IOS_API_KEY": "YOUR_IOS_API_KEY"
      }
    }
  }
}
```

---

## Recommended Approach

**Use EAS Secrets (Option 1)** because:
1. API keys are sensitive credentials
2. Secrets are encrypted and not visible in logs
3. Easier to rotate keys without updating config files
4. Can be different for each environment (dev, preview, production)

---

## After Adding Secrets

1. Verify secrets are configured:
   ```bash
   eas secret:list
   ```

2. Build your app (secrets will be automatically available):
   ```bash
   eas build --platform android
   ```

3. The `app.config.js` will automatically read the secrets via `process.env.GOOGLE_MAPS_ANDROID_API_KEY`

---

## How It Works

During the EAS build process:
1. EAS loads your secrets and makes them available as environment variables
2. `app.config.js` runs and reads `process.env.GOOGLE_MAPS_ANDROID_API_KEY`
3. The API key is injected into the native Android configuration
4. The MapView component can access Google Maps services

**Important**: These keys are **build-time only** - they're baked into the native config but NOT exposed in your JavaScript bundle.

---

## Managing Secrets

### Update a secret:
```bash
eas secret:delete --name GOOGLE_MAPS_ANDROID_API_KEY
eas secret:create --scope project --name GOOGLE_MAPS_ANDROID_API_KEY --value NEW_KEY --type string
```

### Delete a secret:
```bash
eas secret:delete --name GOOGLE_MAPS_ANDROID_API_KEY
```

### List all secrets:
```bash
eas secret:list
```

---

## Important Notes

1. **Secrets are per-project**: Use `--scope project` to apply to this project only
2. **Secrets are available in all build profiles**: Unless you override them in specific profiles
3. **Local development still uses .env**: Your local `.env` file is only for local development
4. **Keep .env in .gitignore**: Never commit your local `.env` file to version control

---

## Next Steps

1. Run the commands above to add your secrets to EAS
2. Verify with `eas secret:list`
3. Build your Android app: `eas build --platform android`
4. The MapScreen will now work in the production build!
