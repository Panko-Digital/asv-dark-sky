# Google Play Store Privacy Policy Requirements

## Issue
Google Play Store is rejecting your app upload because it uses sensitive permissions (CAMERA, LOCATION) without a privacy policy URL declared.

**Error Message:** "Your APK or Android App Bundle is using permissions that require a privacy policy: (android.permission.CAMERA)"

## Permissions in Your App (Confirmed ✅)

Your `app.json` correctly declares these permissions:
```json
"android": {
  "permissions": [
    "android.permission.CAMERA",           // ⚠️ Requires privacy policy
    "android.permission.ACCESS_FINE_LOCATION",    // ⚠️ Requires privacy policy
    "android.permission.ACCESS_COARSE_LOCATION"   // ⚠️ Requires privacy policy
  ]
}
```

These permissions are properly configured in your code. The issue is NOT with your app code - it's with your Play Store listing.

## Solution Steps

### Step 1: Create Your Privacy Policy

1. **Use the template** provided in `PRIVACY_POLICY_TEMPLATE.md`
2. **Customize it** with:
   - Your contact email
   - Effective date (today's date)
   - Any additional details specific to your app

### Step 2: Host Your Privacy Policy

You need to make your privacy policy accessible via a public URL. Options:

#### Option A: GitHub Pages (FREE, Easy)
```bash
# Create a simple HTML page in your repo
mkdir privacy
cd privacy
# Create index.html with your privacy policy
git add privacy/
git commit -m "Add privacy policy"
git push

# Enable GitHub Pages in repo settings
# Your URL will be: https://seniorcreative.github.io/asv-dark-sky/privacy/
```

#### Option B: Host on panko.digital
Create a page at: `https://panko.digital/privacy/asv-dark-sky`

#### Option C: Google Sites (FREE)
1. Go to https://sites.google.com
2. Create a new site
3. Add your privacy policy content
4. Publish and get the URL

#### Option D: Simple HTML hosting
Use services like:
- GitHub Pages (free)
- Netlify (free)
- Vercel (free)
- Firebase Hosting (free)

### Step 3: Add Privacy Policy to Play Console

1. **Log into Google Play Console**
2. **Navigate to your app**
3. **Go to:** App content → Privacy Policy
4. **Enter your privacy policy URL**
5. **Save**

### Step 4: Resubmit Your App

After adding the privacy policy URL to Play Console:
1. You can resubmit the same .aab file
2. No need to rebuild the app
3. Google will re-review your submission

## What Google Play Requires

According to Google Play policy, apps must have a privacy policy if they:
- ✅ Request sensitive permissions (CAMERA, LOCATION)
- ✅ Collect personal or sensitive data
- ✅ Handle user-generated content

Your app does all three, so a privacy policy is **mandatory**.

## Privacy Policy Requirements

Your privacy policy must:
- ✅ Be accessible via a valid, active URL
- ✅ Use HTTPS (secure connection)
- ✅ Be publicly accessible (no login required)
- ✅ Clearly explain what data you collect
- ✅ Explain how you use the data
- ✅ Explain how users can delete their data
- ✅ Include a way to contact you

## Quick Privacy Policy Hosting with GitHub Pages

Here's the fastest way to get your privacy policy online:

```bash
cd /Users/stevensmith/Documents/Repos/asvgeelong-sqm/CameraApp

# Create privacy policy HTML
cat > privacy.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASV Dark Sky - Privacy Policy</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #ff0000; }
        h2 { color: #cc0000; margin-top: 30px; }
        h3 { color: #990000; }
        .contact { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <!-- Paste your privacy policy content here -->
</body>
</html>
EOF

# Commit and push
git add privacy.html
git commit -m "Add privacy policy for Play Store"
git push origin main

# Then enable GitHub Pages in repo settings:
# Settings → Pages → Source: main branch → Save
```

Your privacy policy will be available at:
`https://seniorcreative.github.io/asv-dark-sky/privacy.html`

## Alternative: Quick Firebase Hosting

If you prefer Firebase hosting:

```bash
cd /Users/stevensmith/Documents/Repos/asvgeelong-sqm/CameraApp

# Create public directory
mkdir -p public
cp PRIVACY_POLICY_TEMPLATE.md public/privacy-policy.md

# Convert markdown to HTML (or create HTML manually)
# Then deploy
firebase deploy --only hosting
```

## Important Notes

1. **You don't need to rebuild your app** - just add the URL to Play Console
2. **The privacy policy URL is separate from your app code** - it's a Play Store requirement
3. **Keep your privacy policy updated** if you change how you handle data
4. **Make sure the URL is permanent** - don't use temporary hosting
5. **Test the URL** before submitting to ensure it's publicly accessible

## Play Store Submission Checklist

Before resubmitting:
- [ ] Privacy policy is written and complete
- [ ] Privacy policy is hosted on a public HTTPS URL
- [ ] Privacy policy URL is added to Play Console
- [ ] Privacy policy mentions CAMERA and LOCATION permissions specifically
- [ ] Contact information is included in the policy
- [ ] Privacy policy is accessible (test in incognito browser)

## After Approval

Once approved, you must:
- Keep the privacy policy URL active (don't delete it)
- Update the policy if you add new permissions or data collection
- Notify users of significant privacy policy changes

## Resources

- [Google Play Privacy Policy Requirements](https://support.google.com/googleplay/android-developer/answer/9859455)
- [Privacy Policy Generator](https://www.privacypolicygenerator.info/)
- [GitHub Pages Setup](https://pages.github.com/)

## Need Help?

If you need assistance:
1. Use the template provided in `PRIVACY_POLICY_TEMPLATE.md`
2. Host it on GitHub Pages (easiest option)
3. Add the URL to Play Console under "App content" → "Privacy Policy"
4. Resubmit your app
