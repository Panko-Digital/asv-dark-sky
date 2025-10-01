# 🔐 API Key Security

## Important: Never Commit API Keys!

This project uses environment variables to keep sensitive API keys secure.

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Add your keys to `.env`:**
   ```bash
   EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY=your_key_here
   EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=your_key_here
   ```

3. **The `.env` file is in `.gitignore`** - it won't be committed ✅

## How It Works

- **`app.config.js`** - Reads environment variables at build time
- **`.env`** - Contains your actual API keys (git-ignored)
- **`.env.example`** - Template for other developers (safe to commit)
- **`.gitignore`** - Ensures `.env` is never tracked by git

## For Team Members

If you're cloning this repo:
1. Copy `.env.example` to `.env`
2. Ask the team lead for the API keys
3. Add them to your local `.env` file
4. Never commit `.env` to git!

## Verification

Check that `.env` is ignored:
```bash
git status
# .env should NOT appear in the list
```

## See Also

- `GOOGLE_MAPS_SETUP.md` - Complete guide to getting API keys
- `app.config.js` - Configuration file that injects env vars
