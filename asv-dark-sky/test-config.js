// Test script to verify app.config.js produces correct output
require('dotenv').config();

const appJson = require('./app.json');
const appConfigModule = require('./app.config.js');

const finalConfig = appConfigModule({ config: appJson.expo });

console.log('=== FINAL ANDROID CONFIG ===');
console.log(JSON.stringify(finalConfig.android, null, 2));

console.log('\n=== GOOGLE MAPS API KEY ===');
console.log('Android API Key:', finalConfig.android?.config?.googleMaps?.apiKey);

console.log('\n=== VERIFICATION ===');
if (finalConfig.android?.config?.googleMaps?.apiKey) {
    console.log('✅ Google Maps API key is configured for Android');
} else {
    console.log('❌ Google Maps API key is MISSING for Android');
}

if (finalConfig.android?.permissions) {
    console.log('✅ Android permissions are configured');
} else {
    console.log('❌ Android permissions are MISSING');
}

if (finalConfig.android?.package) {
    console.log('✅ Android package name is configured:', finalConfig.android.package);
} else {
    console.log('❌ Android package name is MISSING');
}
