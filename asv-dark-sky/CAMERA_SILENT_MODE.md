# Camera Silent Mode Configuration

## Overview
This document explains the configurations made to ensure the camera operates silently without shutter sounds or screen flashes, particularly on Android devices.

## Implemented Solutions

### 1. CameraView Component Settings
**File:** `screens/CameraScreen.tsx`

```tsx
<CameraView
  style={styles.camera}
  ref={ref}
  mode={mode}
  mute={true}                    // Disables all audio
  flash="off"                     // Disables camera flash
  enableTorch={false}             // Disables torch/flashlight
  animateShutter={false}          // Disables shutter animation (no screen flash)
  responsiveOrientationWhenOrientationLocked
/>
```

**Key Properties:**
- `mute={true}` - Prevents any camera sounds
- `flash="off"` - Ensures flash is disabled
- `enableTorch={false}` - Disables the torch/flashlight feature
- `animateShutter={false}` - **NEW** - Prevents the white screen flash animation on capture

### 2. takePictureAsync Options
**File:** `screens/CameraScreen.tsx`

```tsx
const photo = await ref.current?.takePictureAsync({
  quality: 0.8,
  base64: true,
  exif: false,
  skipProcessing: true,        // Skip post-processing (faster, no effects)
  isImageMirror: false,        // Disable mirroring
});
```

**Key Options:**
- `skipProcessing: true` - Bypasses post-processing that might trigger sounds/animations
- `isImageMirror: false` - Explicitly disable mirroring effects

### 3. Android Permissions
**File:** `app.json`

```json
"android": {
  "permissions": [
    "android.permission.CAMERA",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION"
  ]
}
```

**Important:** No `RECORD_AUDIO` permission is requested, which helps prevent audio-related behaviors.

### 4. Expo Camera Plugin Configuration
**File:** `app.json`

```json
[
  "expo-camera",
  {
    "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera",
    "recordAudioAndroid": false,    // Explicitly disable audio on Android
    "saveToCameraRoll": false
  }
]
```

**Key Setting:**
- `recordAudioAndroid: false` - Explicitly disables audio recording on Android

## Platform-Specific Behavior

### Android
- **Shutter Sound:** Some Android devices have mandatory shutter sounds due to local regulations (Japan, South Korea). These cannot be disabled by apps.
- **Screen Flash:** The `animateShutter={false}` setting should prevent the white screen flash
- **System Sounds:** If the device is in silent mode, most shutter sounds will be muted

### iOS
- **Shutter Sound:** iOS devices respect the mute switch. Silent mode will disable shutter sounds.
- **Screen Flash:** The `animateShutter={false}` setting prevents the preview flash
- **Live Photos:** Not enabled in this app

## Testing Checklist

- [ ] Camera captures photo without audible shutter sound
- [ ] No white screen flash when taking photo
- [ ] Camera flash remains off during capture
- [ ] Torch/flashlight is disabled
- [ ] Silent mode on device is respected
- [ ] No audio permissions requested on Android
- [ ] Works correctly in both light and dark frame capture modes

## Known Limitations

1. **Regulatory Compliance:** Some regions (Japan, South Korea) require mandatory camera shutter sounds for privacy reasons. Apps cannot override these system-level sounds.

2. **Device-Specific Behavior:** Some Android manufacturers add their own camera sound policies that apps cannot control.

3. **System Volume:** If a device's system volume is high, some devices may still produce minimal camera sounds regardless of app settings.

## Troubleshooting

### If shutter sound is still present:

1. **Check device settings:**
   - Ensure device is in silent/vibrate mode
   - Check if "Camera sound" is disabled in system settings
   - Lower system volume

2. **Check regional restrictions:**
   - Some regions have mandatory shutter sounds
   - Cannot be disabled by software

3. **Verify app configuration:**
   - Ensure native folders are rebuilt with latest settings
   - Run `npx expo prebuild --clean` to regenerate native code
   - Rebuild the app completely

### If screen flash still occurs:

1. **Verify CameraView props:**
   - Confirm `animateShutter={false}` is set
   - Confirm `flash="off"` is set

2. **Check for custom animations:**
   - Ensure no custom screen overlay animations
   - Check for any View animations during capture

## Best Practices for Silent Operation

1. **Always set `animateShutter={false}`** - This is the most important setting for preventing screen flash

2. **Use `skipProcessing: true`** in takePictureAsync - Reduces processing time and potential side effects

3. **Avoid recording audio permission** - Don't request audio permissions unless absolutely necessary

4. **Test on multiple devices** - Behavior can vary between manufacturers

5. **Inform users** - If mandatory shutter sounds exist in their region, inform them it's a regulatory requirement

## Future Improvements

- Consider adding a settings toggle for users who want shutter feedback
- Add haptic feedback option as alternative to sound
- Implement custom visual feedback (subtle border flash) instead of screen flash

## References

- [Expo Camera Documentation](https://docs.expo.dev/versions/latest/sdk/camera/)
- [CameraView Props](https://docs.expo.dev/versions/latest/sdk/camera/#cameraview-props)
- [takePictureAsync Options](https://docs.expo.dev/versions/latest/sdk/camera/#takepictureasync)
