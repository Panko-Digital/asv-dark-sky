const { withAppBuildGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin to fix app/build.gradle
 * Comments out buildToolsVersion since it's not set by Expo
 */
const withAndroidAppBuildGradle = (config) => {
    return withAppBuildGradle(config, (config) => {
        let appBuildGradle = config.modResults.contents;

        // Comment out buildToolsVersion line since Expo doesn't set it
        appBuildGradle = appBuildGradle.replace(
            /^(\s*)buildToolsVersion rootProject\.ext\.buildToolsVersion$/m,
            '$1// buildToolsVersion rootProject.ext.buildToolsVersion'
        );

        config.modResults.contents = appBuildGradle;
        return config;
    });
};

module.exports = withAndroidAppBuildGradle;
