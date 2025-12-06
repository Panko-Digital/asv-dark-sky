const { withProjectBuildGradle, withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin to configure Mapbox dependencies
 * Adds Mapbox Maven repository and resolution strategy
 */
const withMapboxConfig = (config) => {
  // Modify root build.gradle
  config = withProjectBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // Add Mapbox Maven repository if not already present
    if (!buildGradle.includes('api.mapbox.com/downloads/v2/releases/maven')) {
      const mapboxRepo = `
    // Mapbox Maven repository - required for @rnmapbox/maps
    maven {
      url 'https://api.mapbox.com/downloads/v2/releases/maven'
      authentication {
        basic(BasicAuthentication)
      }
      credentials {
        username = 'mapbox'
        def token = System.getenv('MAPBOX_DOWNLOADS_TOKEN')
        if (token == null || token.isEmpty()) {
          token = project.findProperty('MAPBOX_DOWNLOADS_TOKEN') ?: ""
        }
        password = token
      }
    }`;

      // Insert after mavenCentral() in allprojects.repositories
      buildGradle = buildGradle.replace(
        /(allprojects\s*\{[\s\S]*?repositories\s*\{[\s\S]*?mavenCentral\(\))/,
        `$1${mapboxRepo}`
      );
    }

    // Add resolution strategy if not already present
    if (!buildGradle.includes('mapbox-sdk-turf')) {
      const resolutionStrategy = `
  
  // Resolution strategy to handle missing Mapbox dependencies
  configurations.all {
    resolutionStrategy {
      // Force use of available Turf version
      force 'com.mapbox.mapboxsdk:mapbox-sdk-turf:6.15.0'
    }
  }`;

      // Insert before the closing brace of allprojects
      buildGradle = buildGradle.replace(
        /(allprojects\s*\{[\s\S]*?repositories\s*\{[\s\S]*?\}[\s\S]*?)\n\}/,
        `$1${resolutionStrategy}\n}`
      );
    }

    config.modResults.contents = buildGradle;
    return config;
  });

  // Modify app/build.gradle
  config = withAppBuildGradle(config, (config) => {
    let appBuildGradle = config.modResults.contents;

    // Add Mapbox configuration before android block if not already present
    if (!appBuildGradle.includes('RNMapboxMapsImpl')) {
      const mapboxConfig = `
// Force Mapbox to use standard variant (not NDK27) even with targetSdk 35+
// This avoids the non-existent android-ndk27 dependency
ext {
    RNMapboxMapsImpl = "mapbox"
    RNMapboxMapsVersion = "11.16.2"
}

`;

      // Insert before android { block
      appBuildGradle = appBuildGradle.replace(
        /\nandroid\s*\{/,
        `\n${mapboxConfig}android {`
      );
    }

    config.modResults.contents = appBuildGradle;
    return config;
  });

  return config;
};

module.exports = withMapboxConfig;
