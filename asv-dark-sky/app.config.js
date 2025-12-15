require('dotenv').config();

module.exports = ({ config }) => {
    return {
        ...config,
        // Let Expo handle Android SDK versions (defaults to 36)
        extra: {
            ...config.extra,
            // Mapbox API key - public token safe for client-side use
            mapboxApiKey: process.env.EXPO_PUBLIC_MAPBOX_API_KEY,
        },
        // Note: Google Maps configuration removed - app now uses Mapbox
        // If you need Google Maps in the future, uncomment and configure:
        // ios: {
        //     ...config.ios,
        //     config: {
        //         googleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
        //     },
        //     infoPlist: {
        //         ...config.ios?.infoPlist,
        //         GoogleMapsApiKey: process.env.GOOGLE_MAPS_IOS_API_KEY,
        //     },
        // },
        // android: {
        //     ...config.android,
        //     config: {
        //         ...(config.android?.config || {}),
        //         googleMaps: {
        //             apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY,
        //         },
        //     },
        // },
    };
};
