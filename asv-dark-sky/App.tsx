import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import AntDesign from "@expo/vector-icons/AntDesign";
// import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

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

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  // const [uris, setUris] = useState<string[]>([]);
  const [darkFrame, setDarkFrame] = useState<string | null>(null);
  const [lightFrame, setLightFrame] = useState<string | null>(null);

  const [mode, setMode] = useState<CameraMode>("picture");
  const [frame, setFrame] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<ViewMode>("review");
  const [SQM, setSQM] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exposureTime, setExposureTime] = useState<number>(3000); // in milliseconds

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", color: "#ff0000ff" }}>
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
          <Text>Grant permission</Text>
        </Pressable>
      </View>
    );
  }

  const reset = (label: string) => {
    // setUris([]);
    if (label === "Sky Photo") {
      setLightFrame(null);
    } else {
      setDarkFrame(null);
    }
    // setSQM(null);
    // setError(null);
    setViewMode("review");
  };

  const takePicture = async () => {
    try {
      const photo = await ref.current?.takePictureAsync({
        quality: 0.8,
        base64: true,
        exif: false,
      });
      console.log("Photo taken:", photo);
      console.log("Platform:", Platform.OS);

      if (photo?.uri) {
        console.log("Photo URI:", photo.uri);
        console.log("URI accessible:", await checkUriAccessible(photo.uri));
        if (frame === "light") {
          setLightFrame(photo.uri);
        } else {
          setDarkFrame(photo.uri);
        }
        // setUris((prev) => [...prev, photo.uri]);
        setViewMode("review");
      } else {
        console.log("No photo URI received");
        Alert.alert("Error", "Failed to capture photo - no URI received");
      }
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
    // send uris to server
    // let lightFrame = uris[0];
    // let darkFrame = uris[1];
    if (lightFrame && darkFrame) {
      setLoading(true);
      setError(null);
      setSQM(null);
      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          light_image: lightFrame,
          dark_image: darkFrame,
          zero_point: 20.0,
          exposure_time_s: exposureTime / 1000,
          metadata: {
            location: "optional_location_info",
            timestamp: "optional_timestamp",
          },
        }),
      });

      setLoading(false);

      if (!response.ok) {
        // console.error("Failed to send images to server");
        setSQM(null);
        const errorPayload: errorResponseFormat = await response.json();
        setError(errorPayload.error);
      } else {
        const data: responseFormat = await response.json();

        setSQM(data.sky_quality_meter);
      }
    }
  };

  const renderPictures = () => {
    return (
      <View style={styles.reviewContainer}>
        {[
          { uri: lightFrame, label: "Sky Photo" },
          { uri: darkFrame, label: "Dark Photo" },
        ]
          // .filter((f) => f.uri)
          .map((f) => (
            <View key={f.uri!} style={styles.imageContainer}>
              <Text style={styles.imageLabel}>{f.label}</Text>
              {f.label !== "Sky Photo" && (
                <Text style={styles.shieldLabel}>(Shield camera lenses)</Text>
              )}
              {f.uri ? (
                <View>
                  <Image
                    source={{ uri: f.uri! }}
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
              !(lightFrame && darkFrame) && {
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
          SQM && (
            <Text
              style={{
                textAlign: "center",
                marginTop: 20,
                fontSize: 18,
                color: "#ff0000ff",
              }}
            >
              Sky Quality Measure is {SQM.toFixed(2)}
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
          // pictureSize="800x600"
          // exposure={exposureTime} // in microseconds
          enableTorch={false}
        />
        {/* Exposure controls */}
        {/* {!lightFrame && !darkFrame && (
          <View style={styles.exposureControls}>
            <Text style={styles.exposureLabel}>
              Exposure: {(exposureTime / 1000).toFixed(1)}s
            </Text>
            <View style={styles.exposureButtons}>
              <Pressable
                onPress={() =>
                  setExposureTime(Math.max(100, exposureTime - 500))
                }
                style={styles.exposureButton}
              >
                <Text style={styles.exposureButtonText}>-</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setExposureTime(Math.min(10000, exposureTime + 500))
                }
                style={styles.exposureButton}
              >
                <Text style={styles.exposureButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        )} */}
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
    width: 200,
    height: 200,
    borderRadius: 100,
    aspectRatio: 1,
    marginTop: 10,
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#ff0000",
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
  exposureControls: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  exposureLabel: {
    color: "#ff0000ff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  exposureButtons: {
    flexDirection: "row",
    gap: 20,
  },
  exposureButton: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 2,
    borderColor: "#ff0000",
    borderRadius: 25,
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  exposureButtonText: {
    color: "#ff0000",
    fontSize: 24,
    fontWeight: "bold",
  },
});
