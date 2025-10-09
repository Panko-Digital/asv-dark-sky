# ASV Dark Sky - Privacy Policy Template

## Privacy Policy for ASV Dark Sky

**Effective Date:** [Insert Date]

**Developer:** Panko Digital (https://panko.digital)

### Introduction

ASV Dark Sky ("we", "our", or "the app") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard information when you use our mobile application.

### Information We Collect

#### 1. Camera Access
- **Purpose:** To capture photos of the night sky for measuring sky quality (light pollution)
- **Data Collected:** Photos taken by you using the in-app camera
- **Storage:** Photos are processed locally on your device and sent to our backend server for sky quality calculations
- **Retention:** Images are not permanently stored on our servers after processing

#### 2. Location Data
- **Purpose:** To tag sky quality measurements with geographic coordinates
- **Data Collected:** GPS coordinates (latitude, longitude, altitude, accuracy)
- **Usage:** Location data is attached to your measurements to create a map of sky quality readings
- **Storage:** Location coordinates are stored with your measurements in our database
- **Sharing:** Location data may be displayed on a map visible to other users (precise coordinates are rounded for privacy)

#### 3. Measurement Data
- **Purpose:** To record and display sky quality measurements
- **Data Collected:** 
  - Sky Quality Meter (SQM) readings
  - Timestamp of measurement
  - Moon phase and brightness data
  - Median sky brightness values
- **Storage:** Stored locally on your device and in our cloud database
- **Purpose:** To enable historical tracking and community mapping of sky quality

### How We Use Your Information

We use the collected information to:
- Calculate sky quality measurements from captured images
- Tag measurements with location coordinates
- Display measurements on a map for community reference
- Calculate moon brightness impact on sky quality
- Provide you with historical measurement data

### Data Storage and Security

- **Local Storage:** Measurement history is stored locally on your device using secure local storage
- **Cloud Storage:** Measurements (including location and SQM readings) are stored in Google Cloud Firestore
- **Backend Processing:** Images are temporarily processed on Google Cloud Functions for sky brightness calculations
- **Encryption:** Data transmission uses HTTPS encryption
- **Access Control:** Backend services use secure authentication and access controls

### Data Sharing

We do NOT:
- Sell your personal information to third parties
- Share your data with advertisers
- Use your camera for any purpose other than sky quality measurements
- Access your photos outside of the app

We MAY share:
- Aggregated, anonymized sky quality data for scientific research
- Your measurements on a public map (with approximate location for privacy)

### Your Rights and Choices

You have the right to:
- **Access:** View all your stored measurements in the app's History screen
- **Delete:** Delete individual measurements or clear all history from your device
- **Control:** Grant or revoke camera and location permissions at any time through device settings
- **Opt-out:** Stop using location services by denying location permission (measurements will still work without location data)

### Permissions Required

#### Android Permissions:
- **android.permission.CAMERA** - Required to take photos of the night sky
- **android.permission.ACCESS_FINE_LOCATION** - Required to tag measurements with precise GPS coordinates
- **android.permission.ACCESS_COARSE_LOCATION** - Required for approximate location if fine location unavailable

### Third-Party Services

Our app uses the following third-party services:
- **Google Cloud Platform** - For backend processing and data storage
- **Expo** - For app development and updates
- **Firebase/Firestore** - For cloud data storage

These services have their own privacy policies:
- Google Cloud: https://cloud.google.com/terms/cloud-privacy-notice
- Expo: https://expo.dev/privacy
- Firebase: https://firebase.google.com/support/privacy

### Children's Privacy

Our app does not knowingly collect information from children under 13. The app is intended for astronomy enthusiasts and researchers.

### Changes to This Policy

We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the "Effective Date" at the top of this policy.

### Data Retention

- **Local Data:** Retained on your device until you delete it or uninstall the app
- **Cloud Data:** Measurements stored indefinitely for scientific and historical purposes
- **Images:** Processed images are deleted immediately after calculation (not stored long-term)

### International Users

Our services are hosted on Google Cloud Platform in the Australia Southeast region. By using our app, you consent to the transfer and processing of your information in Australia.

### Contact Us

If you have questions about this Privacy Policy or our data practices, please contact:

**Panko Digital**
- Website: https://panko.digital
- Email: [Insert your contact email]
- Located: Geelong, Victoria, Australia

### Affiliated Organizations

This app is developed for the Astronomical Society of Victoria (ASV) community but is independently operated by Panko Digital.

### Your Consent

By using ASV Dark Sky, you consent to this Privacy Policy and our data practices as described herein.

---

**Last Updated:** [Insert Date]
