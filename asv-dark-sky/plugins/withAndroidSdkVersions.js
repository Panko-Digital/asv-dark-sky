const { withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo config plugin to override Android SDK versions
 * This prevents Mapbox from trying to use non-existent NDK27 variants
 * Also disables new architecture to fix vision-camera compilation
 */
const withAndroidSdkVersions = (config) => {
    return withGradleProperties(config, (config) => {
        // Remove existing newArchEnabled if present
        config.modResults = config.modResults.filter(
            item => !(item.type === 'property' && item.key === 'newArchEnabled')
        );

        config.modResults.push({
            type: 'comment',
            value: ' Use targetSdk 35 for compatibility with most dependencies',
        });
        config.modResults.push({
            type: 'property',
            key: 'targetSdkVersion',
            value: '35',
        });
        config.modResults.push({
            type: 'property',
            key: 'compileSdkVersion',
            value: '35',
        });
        config.modResults.push({
            type: 'property',
            key: 'buildToolsVersion',
            value: '35.0.0',
        });
        config.modResults.push({
            type: 'comment',
            value: ' Enable new architecture (required by react-native-reanimated 4.x)',
        });
        config.modResults.push({
            type: 'property',
            key: 'newArchEnabled',
            value: 'true',
        });
        config.modResults.push({
            type: 'comment',
            value: ' Force Mapbox to use standard variant (not NDK27)',
        });
        config.modResults.push({
            type: 'property',
            key: 'RNMapboxMapsUseStandardVariant',
            value: 'true',
        });
        return config;
    });
};

module.exports = withAndroidSdkVersions;
