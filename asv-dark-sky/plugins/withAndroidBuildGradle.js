const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin to configure Android build.gradle
 * Adds Mapbox Maven repository and resolution strategy
 */
const withAndroidBuildGradle = (config) => {
    return withProjectBuildGradle(config, (config) => {
        let buildGradle = config.modResults.contents;

        // Add Mapbox Maven repository if not already present
        if (!buildGradle.includes('api.mapbox.com/downloads/v2/releases/maven')) {
            const mapboxRepo = `
    // Mapbox Maven repository
    maven {
      url 'https://api.mapbox.com/downloads/v2/releases/maven'
      authentication {
        basic(BasicAuthentication)
      }
      credentials {
        username = 'mapbox'
        password = System.getenv('MAPBOX_DOWNLOADS_TOKEN') ?: project.findProperty('MAPBOX_DOWNLOADS_TOKEN') ?: ""
      }
    }`;

            buildGradle = buildGradle.replace(
                /(allprojects\s*\{[\s\S]*?repositories\s*\{[\s\S]*?mavenCentral\(\))/,
                `$1${mapboxRepo}`
            );
        }

        // Add resolution strategy if not already present
        if (!buildGradle.includes('mapbox-sdk-turf')) {
            const resolutionStrategy = `
  
  // Force use of available Turf version
  configurations.all {
    resolutionStrategy {
      force 'com.mapbox.mapboxsdk:mapbox-sdk-turf:6.15.0'
    }
  }`;

            buildGradle = buildGradle.replace(
                /(allprojects\s*\{[\s\S]*?repositories\s*\{[\s\S]*?\}[\s\S]*?)\n\}/,
                `$1${resolutionStrategy}\n}`
            );
        }

        config.modResults.contents = buildGradle;
        return config;
    });
};

module.exports = withAndroidBuildGradle;
