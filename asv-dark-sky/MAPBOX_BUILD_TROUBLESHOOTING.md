# Mapbox Android Build Troubleshooting

## Current Issue
Build is failing because Mapbox repository isn't being searched, even though it's configured in `settings.gradle`.

## Verification Steps

### 1. Verify Token is Set
```bash
# Check EAS environment variables
eas env:list

# Should show:
# MAPBOX_DOWNLOADS_TOKEN=sk.xxxxx...
```

If not set, add it:
```bash
eas env:set MAPBOX_DOWNLOADS_TOKEN your_mapbox_token
```

### 2. Verify Token Has Correct Scope
- Go to https://account.mapbox.com/access-tokens/
- Check that your token has `DOWNLOADS:READ` scope
- If not, create a new token with this scope

### 3. Test Repository Access
The Mapbox repository should be accessible at:
- URL: `https://api.mapbox.com/downloads/v2/releases/maven`
- Username: `mapbox` (always lowercase)
- Password: Your token with `DOWNLOADS:READ` scope

### 4. Check Build Logs
Look for these in the build output:
- Repository search locations (should include Mapbox URL)
- Authentication errors
- Network errors

## Common Issues

### Repository Not in Search List
If the Mapbox repository URL doesn't appear in the "Searched in the following locations" list, it means:
- The repository isn't being added to the resolution list
- There might be a syntax error in `settings.gradle`
- The `dependencyResolutionManagement` block might not be working

**Solution**: Check that `settings.gradle` has the Mapbox repository in the `dependencyResolutionManagement.repositories` block.

### Authentication Failing Silently
If authentication fails, Gradle might skip the repository without showing an error.

**Solution**: 
1. Verify token is set: `eas env:list`
2. Verify token has `DOWNLOADS:READ` scope
3. Try accessing the repository manually to test credentials

### Token Not Available During Build
EAS environment variables might not be available during the Gradle dependency resolution phase.

**Solution**: 
1. Ensure token is set as project-scoped: `eas env:set --scope project MAPBOX_DOWNLOADS_TOKEN your_token`
2. Check that it's available in all build profiles (production, preview, development)

## Alternative Solutions

### Option 1: Use Gradle Properties File
If environment variables aren't working, you can set the token directly in `gradle.properties` (but this is less secure):

```properties
MAPBOX_DOWNLOADS_TOKEN=your_token_here
```

**Note**: This file should NOT be committed to git if it contains the actual token.

### Option 2: Check @rnmapbox/maps Documentation
The `@rnmapbox/maps` package might have specific setup requirements. Check:
- https://github.com/rnmapbox/maps
- Package README for Android setup instructions

### Option 3: Verify Package Version
The error shows it's looking for `com.mapbox.maps:android-ndk27:10.19.0`. Verify this version exists and matches your `@rnmapbox/maps` version (10.1.45).

## Next Steps

1. **Verify token is set**: `eas env:list`
2. **Verify token scope**: Check Mapbox account dashboard
3. **Try building again**: `eas build --platform android`
4. **Check build logs**: Look for Mapbox repository in search locations
5. **If still failing**: Check @rnmapbox/maps GitHub issues for similar problems

