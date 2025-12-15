const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo config plugin to set Android SDK versions
 * Keeps it simple - just sets gradle properties
 */
const withAndroidSdkVersions = (config) => {
    return withGradleProperties(config, (config) => {
        // Remove any existing SDK version entries to avoid duplicates
        config.modResults = config.modResults.filter(
            item => !(item.type === 'property' && (
                item.key === 'targetSdkVersion' ||
                item.key === 'compileSdkVersion' ||
                item.key === 'newArchEnabled'
            ))
        );

        // Add our SDK versions
        config.modResults.push({
            type: 'comment',
            value: ' Android SDK versions',
        });
        config.modResults.push({
            type: 'property',
            key: 'targetSdkVersion',
            value: '36',
        });
        config.modResults.push({
            type: 'property',
            key: 'compileSdkVersion',
            value: '36',
        });
        config.modResults.push({
            type: 'property',
            key: 'newArchEnabled',
            value: 'true',
        });

        return config;
    });
};

module.exports = withAndroidSdkVersions;
