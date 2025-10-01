# ✅ Security Checklist - API Keys

## Pre-Commit Verification

Before committing any code, verify these items:

### 1. Check Info.plist
```bash
grep -A1 "GoogleMapsApiKey" ios/asvdarksky/Info.plist
```
**Expected:** `<string>$(GOOGLE_MAPS_API_KEY_IOS)</string>` ✅
**NOT:** `<string>AIzaSy...actual_key</string>` ❌

### 2. Check .env is Ignored
```bash
git status .env
```
**Expected:** "nothing to commit, working tree clean" ✅
**NOT:** "Untracked files: .env" ❌

### 3. Check No Keys in app.config.js
```bash
grep -i "AIzaSy" app.config.js
```
**Expected:** No output ✅
**NOT:** Shows actual API key ❌

### 4. Check Git Diff
```bash
git diff
```
**Verify:**
- ✅ Info.plist shows `$(GOOGLE_MAPS_API_KEY_IOS)` variable
- ✅ No actual API keys visible
- ✅ Only references to `process.env.EXPO_PUBLIC_*`

### 5. Check .gitignore
```bash
cat .gitignore | grep -E "\.env$"
cat ios/.gitignore | grep -E "\.xcode\.env\.local|Config\.xcconfig"
```
**Expected:**
```
.env
.xcode.env.local
Config.xcconfig
```

## Files That Should Be Committed

✅ **Safe to commit:**
```
.env.example
.gitignore
ios/.gitignore
ios/asvdarksky/Info.plist (with variables)
ios/Podfile (with env loading)
app.config.js (with process.env references)
SECURE_API_KEY_SOLUTION.md
```

## Files That Should NEVER Be Committed

❌ **Never commit:**
```
.env
ios/.xcode.env.local
ios/Config.xcconfig (if it exists)
Any file containing "AIzaSy..."
```

## Quick Security Test

Run this before every commit:
```bash
# Should find NOTHING:
git diff | grep -i "AIzaSy"

# Should be empty:
git status .env

# Should show variable only:
git diff ios/asvdarksky/Info.plist | grep GoogleMapsApiKey
```

## If You Accidentally Committed a Key

1. **Don't panic!** But act quickly.
2. **Rotate the key immediately** in Google Cloud Console
3. **Remove from git history:**
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch ios/asvdarksky/Info.plist" \
  --prune-empty --tag-name-filter cat -- --all
```
4. **Force push** (coordinate with team first!)
5. **Update .env** with new key
6. **Rebuild:** `npx expo run:ios`

## Team Onboarding Checklist

When a new developer joins:
- [ ] Clone the repository
- [ ] Copy `.env.example` to `.env`
- [ ] Ask team lead for API keys (use secure channel!)
- [ ] Add keys to `.env`
- [ ] Verify `.env` is git-ignored: `git status .env`
- [ ] Run `npx expo run:ios`
- [ ] Test map functionality

## Current Status ✅

- [x] API keys moved to `.env`
- [x] `.env` is git-ignored
- [x] Info.plist uses variables
- [x] Podfile loads from .env
- [x] .xcode.env.local loads for Xcode
- [x] Unnecessary scripts removed
- [x] Documentation created
- [x] Verified nothing sensitive in git diff

## Ready to Commit! 🎉

Your API keys are now secure and won't be committed to git.
