#!/usr/bin/env node

/**
 * Post-install script to patch @rnmapbox/maps to always use standard variant
 * This prevents it from trying to use the non-existent android-ndk27 variant
 */

const fs = require('fs');
const path = require('path');

const buildGradlePath = path.join(
    __dirname,
    '../node_modules/@rnmapbox/maps/android/build.gradle'
);

try {
    let content = fs.readFileSync(buildGradlePath, 'utf8');

    // Replace the conditional that checks targetSdk >= 35
    // Force it to always use the standard android variant
    const originalPattern = /if \(targetSdk >= 35\) \{[\s\S]*?implementation "com\.mapbox\.maps:android-ndk27:\$\{mapboxVersion\}"[\s\S]*?\} else \{[\s\S]*?implementation "com\.mapbox\.maps:android:\$\{mapboxVersion\}"[\s\S]*?\}/;

    const replacement = `// Patched: Always use standard variant (not NDK27)
            // Original code checked: if (targetSdk >= 35) use NDK27
            // But android-ndk27:11.16.2 doesn't exist in Mapbox Maven
            implementation "com.mapbox.maps:android:\${mapboxVersion}"`;

    if (content.match(originalPattern)) {
        content = content.replace(originalPattern, replacement);
        fs.writeFileSync(buildGradlePath, content, 'utf8');
        console.log('✅ Successfully patched @rnmapbox/maps to use standard variant');
    } else {
        console.log('⚠️  Pattern not found - @rnmapbox/maps may have been updated');
    }
} catch (error) {
    console.error('❌ Error patching @rnmapbox/maps:', error.message);
    process.exit(1);
}
