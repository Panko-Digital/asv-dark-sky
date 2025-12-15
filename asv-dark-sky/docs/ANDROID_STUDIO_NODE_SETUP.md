# Android Studio Node.js Setup

## Problem
Android Studio can't find Node.js when syncing Gradle, causing errors like:
- "A problem occurred starting process 'command 'node''"
- "error=2, No such file or directory"

## Solution: Set NODE_BINARY

The Expo autolinking plugin requires `NODE_BINARY` to be available. For Android Studio Narwhal 3 (which doesn't have environment variable settings), we use JVM system properties.

### Option 1: Already Configured (Recommended)

The `NODE_BINARY` is already set in `android/gradle.properties` via `org.gradle.jvmargs`. 

**To update the path**, edit `android/gradle.properties` and change the path in this line:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -DNODE_BINARY=/Users/stevensmith/.nvm/versions/node/v22.17.1/bin/node
```

Replace `/Users/stevensmith/.nvm/versions/node/v22.17.1/bin/node` with your Node.js path (find it with `which node`).

### Option 2: Add to Shell Profile (Alternative)

If the gradle.properties approach doesn't work, add to your `~/.zshrc` or `~/.bash_profile`:

```bash
export NODE_BINARY=$(which node)
```

Then restart Android Studio.

## Verify Node.js Path

To find your Node.js path:
```bash
which node
```

## After Setting NODE_BINARY

1. **Invalidate Caches**: File → Invalidate Caches... → Invalidate and Restart
2. **Sync Project**: File → Sync Project with Gradle Files
3. The sync should now work without Node.js errors

## Note

The `NODE_BINARY` in `gradle.properties` helps with some Gradle tasks, but the Expo autolinking plugin specifically needs it as an environment variable that Android Studio's Gradle daemon can access.

