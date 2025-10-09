# GitGuardian Secret Scanning Setup

## What is GitGuardian ggshield?

GitGuardian ggshield is a security tool that scans your code for secrets (API keys, passwords, tokens, etc.) before you commit them to Git. It helps prevent accidental exposure of sensitive credentials.

---

## Installation

### Option 1: Homebrew (Recommended for macOS)

```bash
brew install gitguardian/tap/ggshield
```

### Option 2: pip (Python)

```bash
pip install ggshield
```

### Option 3: pipx (Isolated Python environment)

```bash
pipx install ggshield
```

---

## Verify Installation

```bash
ggshield --version
```

You should see something like: `ggshield, version X.X.X`

---

## Configuration (Optional but Recommended)

### 1. Get a Free GitGuardian Account

Visit https://dashboard.gitguardian.com/signup and create a free account.

### 2. Get Your API Key

After signing up, get your API key from: https://dashboard.gitguardian.com/api/personal-access-tokens

### 3. Configure ggshield

```bash
ggshield auth login --method token --token YOUR_API_TOKEN
```

**Note**: You can use ggshield without an API key, but you'll get limited features and rate limits.

---

## Pre-Commit Hook Setup

### ✅ Already Configured!

A pre-commit hook has been installed in `.git/hooks/pre-commit` that automatically runs ggshield before each commit.

### What the Hook Does

1. **Before each commit**: Scans staged files for secrets
2. **If secrets found**: Blocks the commit and shows warnings
3. **If clean**: Allows commit to proceed
4. **If ggshield not installed**: Warns you but allows commit (graceful degradation)

---

## Testing the Hook

### Test 1: Try to commit a file with a fake API key

```bash
echo "API_KEY=sk_test_1234567890abcdef" > test-secret.txt
git add test-secret.txt
git commit -m "test"
```

**Expected result**: Commit should be blocked with a warning about the API key.

### Test 2: Clean up and commit normally

```bash
git reset HEAD test-secret.txt
rm test-secret.txt
git commit -m "test" --allow-empty
```

**Expected result**: Commit should succeed.

---

## Manual Scanning

You can manually scan your repository at any time:

### Scan all files

```bash
ggshield secret scan repo .
```

### Scan specific files

```bash
ggshield secret scan path README.md
```

### Scan before committing (what the hook does)

```bash
ggshield secret scan pre-commit
```

---

## What Gets Detected?

ggshield can detect 350+ types of secrets including:

- ✅ API Keys (AWS, Google, Azure, etc.)
- ✅ OAuth tokens
- ✅ Private keys (SSH, RSA, etc.)
- ✅ Database credentials
- ✅ JWT tokens
- ✅ Slack tokens
- ✅ Stripe keys
- ✅ And many more...

---

## Bypassing the Hook (Not Recommended)

If you need to bypass the pre-commit hook in an emergency:

```bash
git commit --no-verify -m "your message"
```

**⚠️ WARNING**: Only use this if you're absolutely certain there are no secrets in your commit!

---

## False Positives

If ggshield detects a false positive (something that looks like a secret but isn't):

### Option 1: Use a `.gitguardian.yaml` config file

Create `.gitguardian.yaml` in your repo root:

```yaml
version: 2
paths-ignore:
  - "**/*.md"  # Ignore markdown files
  - "**/test-*.js"  # Ignore test files

matches-ignore:
  - name: Placeholder API keys
    match: YOUR_.*_API_KEY  # Ignore placeholder patterns
```

### Option 2: Inline ignore

Add a comment in your code:

```javascript
const apiKey = "abc123"; // ggignore
```

---

## CI/CD Integration

You can also run ggshield in your CI/CD pipeline:

### GitHub Actions Example

```yaml
- name: GitGuardian scan
  uses: GitGuardian/ggshield-action@v1
  env:
    GITGUARDIAN_API_KEY: ${{ secrets.GITGUARDIAN_API_KEY }}
```

---

## Current Protection Status

✅ Pre-commit hook installed at `.git/hooks/pre-commit`  
✅ Hook is executable  
✅ Gracefully handles missing ggshield installation  
✅ `.env` is in `.gitignore`  
✅ All documentation uses placeholders  

---

## Next Steps

1. **Install ggshield** (if not already done):
   ```bash
   brew install gitguardian/tap/ggshield
   ```

2. **Test the hook** (optional):
   ```bash
   echo "test" > test.txt
   git add test.txt
   git commit -m "test"
   ```
   Should succeed ✅

3. **Try to commit a secret** (optional test):
   ```bash
   echo "AWS_KEY=AKIAIOSFODNN7EXAMPLE" > test.txt
   git add test.txt
   git commit -m "test"
   ```
   Should be blocked ❌

4. **Clean up test** (if you ran tests):
   ```bash
   git reset HEAD test.txt
   rm test.txt
   ```

---

## Support & Documentation

- **GitGuardian Docs**: https://docs.gitguardian.com/ggshield-docs/
- **GitHub**: https://github.com/GitGuardian/ggshield
- **Support**: support@gitguardian.com

---

## Why This Matters

One accidentally committed secret can lead to:
- 💰 Unauthorized charges on your cloud accounts
- 🔓 Data breaches
- 🚨 Security incidents
- 😰 Stress and cleanup work
- 💸 Potential fines or legal issues

This pre-commit hook is your safety net! 🛡️
