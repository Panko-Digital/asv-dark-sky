import { useRef, useState, useEffect } from "react";
import * as Location from "expo-location";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import AntDesign from "@expo/vector-icons/AntDesign";
import { saveMeasurement } from "../utils/storage";
import StarfieldBackground from "../components/StarfieldBackground";
import TiltIndicator from "../components/TiltIndicator";
import MeasurementResults from "../components/MeasurementResults";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCameraFormat,
} from "react-native-vision-camera";
import React from "react";

export type ViewMode = "camera" | "review";

export type responseFormat = {
  median_sky_brightness_dn: number;
  sky_quality_meter: number;
  sky_quality_meter_moon_adjusted?: number;
  bortle_class: number;
  bortle_description: string;
  additional_measurements: {
    naked_eye_limiting_magnitude: number;
    luminance_cd_m2: number;
    luminance_mcd_m2: number;
    light_pollution_level: string;
    astronomy_quality: string;
  };
  moon_data?: {
    phase: string;
    illumination: number;
    altitude: number | null;
    impact_magnitude: number;
    impact_description: string;
  };
};

export type errorResponseFormat = {
  error: string;
};

const SERVER_URL =
  "https://australia-southeast2-popkorn-472305.cloudfunctions.net/calculate_sky_brightness";

const getMimeTypeFromUri = (uri?: string | null): string => {
  if (!uri) {
    return "image/jpeg";
  }

  const extension = uri.split("?")[0]?.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "heic":
      return "image/heic";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "image/jpeg";
  }
};

const sanitizeBase64Data = (data: string, uri?: string | null) => {
  const withoutPrefix = data.replace(/^data:[^;]+;base64,/, "");
  const stripped = withoutPrefix.replace(/\s+/g, "");
  const paddingRemainder = stripped.length % 4;
  const padded =
    paddingRemainder === 0
      ? stripped
      : stripped + "=".repeat(4 - paddingRemainder);
  const mimeType = getMimeTypeFromUri(uri);

  return {
    payload: padded,
    dataUri: `data:${mimeType};base64,${padded}`,
  };
};

export default function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const camera = useRef<Camera>(null);
  const device = useCameraDevice("back");

  // Select camera format optimized for low-light photography
  const format = useCameraFormat(device, [
    { photoResolution: "max" }, // Maximum resolution
    { photoHdr: false }, // Disable HDR for manual exposure control
  ]);

  const [lightFrameUri, setLightFrameUri] = useState<string | null>(null);
  const [lightFrameBase64, setLightFrameBase64] = useState<string | null>(null);
  const [darkFrameUri, setDarkFrameUri] = useState<string | null>(null);
  const [darkFrameBase64, setDarkFrameBase64] = useState<string | null>(null);

  const [frame, setFrame] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<ViewMode>("review");
  const [activeTab, setActiveTab] = useState<"light" | "dark">("light"); // For switching between photo views
  const [measurementData, setMeasurementData] = useState<responseFormat | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exposureTime, setExposureTime] = useState<number>(3000); // in milliseconds
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);

  // Activate camera only when permission is granted and viewMode is 'camera'
  useEffect(() => {
    if (hasPermission && viewMode === "camera") {
      setIsCameraActive(true);
    } else {
      setIsCameraActive(false);
    }
  }, [hasPermission, viewMode]);

  // Debug camera device detection
  useEffect(() => {
    console.log("=== CAMERA DEBUG ===");
    console.log("Camera device:", device ? "Found" : "Not found");
    console.log("Has permission:", hasPermission);
    if (device) {
      console.log("Device details:", {
        id: device.id,
        name: device.name,
        hasFlash: device.hasFlash,
        hasTorch: device.hasTorch,
        position: device.position,
      });
    } else {
      console.log(
        "No camera device available - vision-camera may not be properly configured"
      );
    }
    console.log("===================");
  }, [device, hasPermission]);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationError("Permission to access location was denied");
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        console.log("Location acquired:", currentLocation.coords);
      } catch (err) {
        console.error("Error getting location:", err);
        setLocationError("Failed to get location");
      }
    })();
  }, []);

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text
          style={{ textAlign: "center", color: "#ff0000ff", marginBottom: 20 }}
        >
          This app needs your permission to use the camera
        </Text>
        <Pressable
          onPress={requestPermission}
          style={({ pressed }) => [
            {
              backgroundColor: "#000000",
              borderWidth: 2,
              borderRadius: 8,
              borderColor: "#ff0000",
              paddingVertical: 12,
              paddingHorizontal: 20,
              alignItems: "center",
            },
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text style={{ color: "#ff0000" }}>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const reset = (type: "light" | "dark") => {
    if (type === "light") {
      setLightFrameUri(null);
      setLightFrameBase64(null);
    } else {
      setDarkFrameUri(null);
      setDarkFrameBase64(null);
    }
    setMeasurementData(null);
    setError(null);
  };

  const takePicture = async () => {
    if (isCapturing) return;

    try {
      if (!camera.current) {
        Alert.alert("Error", "Camera not ready");
        return;
      }

      setIsCapturing(true);

      const photo = await camera.current.takePhoto({
        enableShutterSound: false,
        flash: "off",
      });

      if (!photo || !photo.path) {
        console.log("Missing photo path", photo);
        Alert.alert(
          "Error",
          "Failed to capture photo data. Please try taking the picture again."
        );
        setIsCapturing(false);
        return;
      }

      console.log("Photo taken:", {
        path: photo.path,
        width: photo.width,
        height: photo.height,
      });

      // Convert photo to base64
      const photoUri = `file://${photo.path}`;
      const response = await fetch(photoUri);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64data = reader.result as string;
        const sanitized = sanitizeBase64Data(base64data, photoUri);

        if (frame === "light") {
          setLightFrameUri(photoUri);
          setLightFrameBase64(sanitized.dataUri);
          // After taking sky photo, switch to dark photo tab
          setActiveTab("dark");
        } else {
          setDarkFrameUri(photoUri);
          setDarkFrameBase64(sanitized.dataUri);
        }

        setViewMode("review");
        setIsCapturing(false);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Camera Error", `Failed to take picture: ${error}`);
      setIsCapturing(false);
    }
  };

  const checkUriAccessible = async (uri: string): Promise<boolean> => {
    try {
      const response = await fetch(uri);
      return response.ok;
    } catch (error) {
      console.error("URI not accessible:", error);
      return false;
    }
  };

  const sendToServer = async () => {
    if (!lightFrameBase64 || !darkFrameBase64) {
      Alert.alert(
        "Missing images",
        "Please capture both the sky and dark photos before sending."
      );
      return;
    }

    if (lightFrameUri && darkFrameUri) {
      setLoading(true);
      setError(null);
      setMeasurementData(null);
      const preparedLight = sanitizeBase64Data(lightFrameBase64, lightFrameUri);
      const preparedDark = sanitizeBase64Data(darkFrameBase64, darkFrameUri);

      const currentTimestamp = new Date().toISOString();
      const locationData = location
        ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
          }
        : null;

      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          light_image: preparedLight.dataUri,
          dark_image: preparedDark.dataUri,
          zero_point: 20.0,
          exposure_time_s: exposureTime / 1000,
          metadata: {
            location: locationData,
            timestamp: currentTimestamp,
          },
        }),
      });

      setLoading(false);

      if (!response.ok) {
        setMeasurementData(null);
        const errorPayload: errorResponseFormat = await response.json();
        setError(errorPayload.error);
      } else {
        const data: responseFormat = await response.json();

        setMeasurementData(data);

        // Save measurement to local storage
        try {
          await saveMeasurement(
            locationData,
            data.sky_quality_meter,
            data.median_sky_brightness_dn,
            data.moon_data,
            data.sky_quality_meter_moon_adjusted
          );
          console.log("Measurement saved to history");
        } catch (saveError) {
          console.error("Failed to save measurement:", saveError);
          // Don't show error to user - just log it
        }
      }
    }
  };

  const renderPictures = () => {
    // Determine which photo to show based on workflow
    const currentPhoto =
      activeTab === "light"
        ? { uri: lightFrameUri, label: "Sky Photo", type: "light" as const }
        : {
            uri: darkFrameUri,
            label: "Dark Photo",
            type: "dark" as const,
          };

    const bothPhotosTaken = lightFrameUri && darkFrameUri;

    return (
      <View style={styles.reviewContainer}>
        {/* Tab navigation - only show if both photos are taken */}
        {bothPhotosTaken && (
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => setActiveTab("light")}
              style={[styles.tab, activeTab === "light" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "light" && styles.tabTextActive,
                ]}
              >
                Sky Photo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("dark")}
              style={[styles.tab, activeTab === "dark" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "dark" && styles.tabTextActive,
                ]}
              >
                Dark Photo
              </Text>
            </Pressable>
          </View>
        )}

        {/* Photo preview or capture prompt */}
        <View style={styles.photoSection}>
          <Text style={styles.photoLabel}>{currentPhoto.label}</Text>

          {currentPhoto.uri ? (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: currentPhoto.uri }}
                contentFit="contain"
                style={styles.photoImage}
                onError={() => {
                  Alert.alert(
                    "Image Error",
                    `Failed to load ${currentPhoto.label}`
                  );
                }}
              />
              <Pressable
                onPress={() => reset(currentPhoto.type)}
                style={styles.deleteButton}
              >
                <AntDesign name="delete" size={24} color="#ff0000" />
                <Text style={styles.deleteText}>Retake</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setFrame(currentPhoto.type);
                setViewMode("camera");
              }}
              style={styles.capturePrompt}
            >
              <AntDesign name="camera" size={32} color="#ff0000" />
              <Text style={styles.capturePromptText}>
                Capture {currentPhoto.label.toLowerCase()}
              </Text>
              {currentPhoto.type === "dark" && (
                <Text style={styles.captureHint}>
                  (Cover lenses and block out all light)
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Action button and results */}
        <View style={styles.actionSection}>
          {!bothPhotosTaken && (
            <Text style={styles.instructionText}>
              {!lightFrameUri
                ? "Step 1: Take a sky photo"
                : "Step 2: Take a dark photo"}
            </Text>
          )}

          {bothPhotosTaken && !loading && (
            <Pressable
              onPress={sendToServer}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.actionButtonText}>Check Sky Quality</Text>
            </Pressable>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ff0000" />
              <Text style={styles.loadingText}>Analyzing...</Text>
            </View>
          )}

          {measurementData && bothPhotosTaken && (
            <MeasurementResults data={measurementData} />
          )}

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </View>
    );
  };

  const renderCamera = () => {
    if (!device) {
      return (
        <View style={styles.cameraMessageContainer}>
          <Text style={styles.cameraMessageText}>
            No camera device available.
          </Text>
          <Text style={styles.cameraMessageSubText}>
            Please ensure the app has camera permissions and try restarting. A
            new build may be required.
          </Text>
        </View>
      );
    }

    return (
      <>
        <Camera
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={isCameraActive}
          photo={true}
          exposure={device.maxExposure} // Use max exposure for longest shutter
        />
        <TiltIndicator position="top-right" />
        {isCapturing && (
          <View style={styles.captureOverlay}>
            <ActivityIndicator size="large" color="#ff0000" />
            <Text style={styles.captureText}>Capturing...</Text>
          </View>
        )}
        <View style={styles.shutterContainer}>
          <Pressable onPress={takePicture} disabled={isCapturing}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed || isCapturing ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: isCapturing ? "#ff0000" : "white",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.cameraContainer,
          viewMode === "review" && { display: "none" },
        ]}
      >
        {renderCamera()}
      </View>
      <View
        style={[
          styles.reviewContainer,
          viewMode === "camera" && { display: "none" },
        ]}
      >
        <StarfieldBackground />
        {renderPictures()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "#ff0000ff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cameraContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  camera: StyleSheet.absoluteFillObject,
  cameraMessageContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    padding: 20,
  },
  cameraMessageText: {
    color: "#ff0000",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 10,
  },
  cameraMessageSubText: {
    color: "#888888",
    fontSize: 14,
    textAlign: "center",
  },
  captureOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  captureText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
  },
  shutterContainer: {
    position: "absolute",
    bottom: 44,
    left: 0,
    width: "100%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  shutterBtn: {
    backgroundColor: "transparent",
    borderWidth: 5,
    borderColor: "white",
    width: 85,
    height: 85,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterBtnInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
  },
  reviewContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    paddingTop: 60,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "#ff0000",
  },
  tabText: {
    color: "#888888",
    fontSize: 14,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#ffffff",
  },
  photoSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  photoLabel: {
    color: "#ff0000",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  photoContainer: {
    width: "50%",
    aspectRatio: 3 / 4,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#ff0000",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  deleteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  deleteText: {
    color: "#ff0000",
    fontSize: 14,
    fontWeight: "600",
  },
  capturePrompt: {
    width: "50%",
    aspectRatio: 3 / 4,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ff0000",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  capturePromptText: {
    color: "#ff0000",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  captureHint: {
    color: "#888888",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
    gap: 12,
  },
  instructionText: {
    color: "#bbbbbb",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: "#ff0000",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
  },
  loadingContainer: {
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    color: "#ff0000",
    fontSize: 16,
  },
  errorText: {
    color: "#ff0000",
    fontSize: 16,
    textAlign: "center",
  },
});
