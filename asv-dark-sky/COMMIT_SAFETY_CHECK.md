# Security - Git Commit Checklist

## ✅ Safe to Commit

These files are safe to commit to version control:

- `app.config.js` - No hardcoded keys, reads from `process.env`
- `.env.example` - Template with placeholder values
- `.gitignore` - Excludes `.env` file
- `FIX_EAS_SECRETS.md` - Uses placeholders `YOUR_ANDROID_API_KEY`
- `EAS_ENVIRONMENT_VARIABLES.md` - Uses placeholders
- All other documentation files

## ❌ NEVER Commit

These files contain actual API keys and must NEVER be committed:

- `.env` - Contains your real API keys
- Any file with actual `AIzaSy...` values

## 🔒 Current Status

✅ `.env` is in `.gitignore`  
✅ `.env.example` uses placeholders  
✅ All documentation uses placeholders  
✅ `app.config.js` reads from environment variables  
✅ No hardcoded keys in committed files  

## Before Committing

Run this check:
```bash
# Make sure no actual API keys are being committed
git diff --cached | grep -i "AIzaSy"
```

If the above command returns any matches with real API keys, DO NOT COMMIT!

## Verified Safe Files

- `FIX_EAS_SECRETS.md` ✅
- `EAS_ENVIRONMENT_VARIABLES.md` ✅  
- `.env.example` ✅
- `app.config.js` ✅

You can safely commit these files now!
