import { CameraMode, CameraView, useCameraPermissions } from "expo-camera";
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

export type ViewMode = "camera" | "review";

export type responseFormat = {
  median_sky_brightness_dn: number;
  sky_quality_meter: number;
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
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [lightFrameUri, setLightFrameUri] = useState<string | null>(null);
  const [lightFrameBase64, setLightFrameBase64] = useState<string | null>(null);
  const [darkFrameUri, setDarkFrameUri] = useState<string | null>(null);
  const [darkFrameBase64, setDarkFrameBase64] = useState<string | null>(null);

  const [mode, setMode] = useState<CameraMode>("picture");
  const [frame, setFrame] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<ViewMode>("review");
  const [SQM, setSQM] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exposureTime, setExposureTime] = useState<number>(3000); // in milliseconds
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [locationError, setLocationError] = useState<string | null>(null);

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

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
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

  const reset = (label: string) => {
    if (label === "Sky Photo") {
      setLightFrameUri(null);
      setLightFrameBase64(null);
    } else {
      setDarkFrameUri(null);
      setDarkFrameBase64(null);
    }
    setSQM(null);
    setViewMode("review");
  };

  const takePicture = async () => {
    try {
      const photo = await ref.current?.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });

      if (!photo || !photo.uri || !photo.base64) {
        console.log("Missing URI or base64 data", photo);
        Alert.alert(
          "Error",
          "Failed to capture photo data. Please try taking the picture again."
        );
        return;
      }

      console.log("Photo taken:", {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        base64Length: photo.base64.length,
      });
      console.log("Platform:", Platform.OS);

      const sanitized = sanitizeBase64Data(photo.base64, photo.uri);
      console.log("Sanitized base64 length:", sanitized.payload.length);

      console.log("Photo URI accessible:", await checkUriAccessible(photo.uri));

      if (frame === "light") {
        setLightFrameUri(photo.uri);
        setLightFrameBase64(sanitized.dataUri);
      } else {
        setDarkFrameUri(photo.uri);
        setDarkFrameBase64(sanitized.dataUri);
      }

      setViewMode("review");
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Camera Error", `Failed to take picture: ${error}`);
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
      setSQM(null);
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
        setSQM(null);
        const errorPayload: errorResponseFormat = await response.json();
        setError(errorPayload.error);
      } else {
        const data: responseFormat = await response.json();

        setSQM(data.sky_quality_meter);

        // Save measurement to local storage
        try {
          await saveMeasurement(
            locationData,
            data.sky_quality_meter,
            data.median_sky_brightness_dn
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
    const frames = [
      { uri: lightFrameUri, label: "Sky Photo" },
      { uri: darkFrameUri, label: "Dark Photo" },
    ];

    return (
      <View style={styles.reviewContainer}>
        {frames.map((f) => (
          <View key={f.label} style={styles.imageContainer}>
            <Text style={styles.imageLabel}>
              {f.label}
              {f.label !== "Sky Photo" && " (Shield camera lenses)"}
            </Text>

            {f.uri ? (
              <View>
                <View style={[styles.dashedBorder, styles.previewFrame]}>
                  <Image
                    source={{ uri: f.uri }}
                    contentFit="cover"
                    style={styles.previewImage}
                    onError={() => {
                      Alert.alert(
                        "Image Error",
                        `Failed to load image: ${f.uri}`
                      );
                    }}
                    onLoad={() => {
                      console.log(`Image loaded successfully: ${f.uri}`);
                    }}
                  />
                </View>
                <Pressable
                  onPress={() => {
                    reset(f.label);
                  }}
                  style={{
                    marginTop: 10,
                    paddingVertical: 0,
                    paddingHorizontal: 20,
                  }}
                >
                  <Text
                    style={{
                      color: "#ff0000",
                      textDecorationLine: "underline",
                      textAlign: "center",
                    }}
                  >
                    Clear
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                <Pressable
                  onPress={() => {
                    setMode("picture");
                    setFrame(f.label === "Sky Photo" ? "light" : "dark");
                    setViewMode("camera");
                  }}
                  style={[styles.emptyImage, styles.dashedBorder]}
                >
                  <Text
                    style={{
                      color: "#ff0000",
                      fontSize: 20,
                      textAlign: "center",
                    }}
                  >
                    <AntDesign name="camera" size={24} color="red" />
                  </Text>
                </Pressable>
                <View style={{ marginTop: 10 }}>
                  <Text>" "</Text>
                </View>
              </View>
            )}
          </View>
        ))}

        {!loading && (
          <Pressable
            onPress={() => {
              sendToServer();
            }}
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
              !(lightFrameBase64 && darkFrameBase64) && {
                opacity: 0,
                pointerEvents: "none",
              },
            ]}
          >
            <Text
              style={{ color: "#ff0000", fontSize: 16, fontWeight: "bold" }}
            >
              Check Sky Quality
            </Text>
          </Pressable>
        )}

        {loading ? (
          <View
            style={{
              marginTop: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ActivityIndicator size="large" color="red" />
          </View>
        ) : (
          SQM &&
          lightFrameBase64 &&
          darkFrameBase64 && (
            <Text
              style={{
                textAlign: "center",
                marginTop: 20,
                fontSize: 18,
                color: "#ff0000ff",
              }}
            >
              Your SQM reading is {SQM.toFixed(2)}
            </Text>
          )
        )}
        {error && (
          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 18,
              color: "#ff0000ff",
            }}
          >
            {error}
          </Text>
        )}
      </View>
    );
  };

  const renderCamera = () => {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={ref}
          mode={mode}
          mute={true}
          responsiveOrientationWhenOrientationLocked
          flash="off"
          enableTorch={false}
        />
        <View style={styles.shutterContainer}>
          <Pressable onPress={takePicture}>
            {({ pressed }) => (
              <View
                style={[
                  styles.shutterBtn,
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.shutterBtnInner,
                    {
                      backgroundColor: mode === "picture" ? "white" : "red",
                    },
                  ]}
                />
              </View>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {viewMode === "review" ? renderPictures() : renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
    alignItems: "center",
    justifyContent: "center",
    color: "#ff0000ff",
  },
  cameraContainer: StyleSheet.absoluteFillObject,
  camera: StyleSheet.absoluteFillObject,
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
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: 192,
    height: 192,
    borderRadius: 96,
    aspectRatio: 1,
  },
  previewFrame: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    padding: 4,
    borderWidth: 2,
  },
  emptyImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  dashedBorder: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#ff0000",
    backgroundColor: "#000000",
  },
  imageLabel: {
    textAlign: "center",
    marginTop: 0,
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff0000ff",
  },
  shieldLabel: {
    textAlign: "center",
    fontSize: 16,
    color: "#ff0000ff",
  },
  debugText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 12,
    color: "#ff0000ff",
  },
});
