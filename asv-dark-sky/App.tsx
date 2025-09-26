import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import { Alert, Button, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
// import AntDesign from "@expo/vector-icons/AntDesign";
// import Feather from "@expo/vector-icons/Feather";
// import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export type ViewMode = "camera" | "review";

export type responseFormat = {
  median_sky_brightness_dn: number;
  sky_quality_meter: number;
};

const SERVER_URL =
  "https://australia-southeast2-popkorn-472305.cloudfunctions.net/calculate_sky_brightness";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uris, setUris] = useState<string[]>([]);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [viewMode, setViewMode] = useState<ViewMode>("camera");
  const [SQM, setSQM] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [facing, setFacing] = useState<CameraType>("back");
  // const [recording, setRecording] = useState(false);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to use the camera
        </Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  const takePicture = async () => {
    try {
      const photo = await ref.current?.takePictureAsync();
      console.log("Photo taken:", photo);
      console.log("Platform:", Platform.OS);

      if (photo?.uri) {
        console.log("Photo URI:", photo.uri);
        console.log("URI accessible:", await checkUriAccessible(photo.uri));
        setUris((prev) => [...prev, photo.uri]);
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

  const toBase64 = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const sendToServer = async () => {
    // send uris to server
    let lightFrame = uris[0];
    let darkFrame = uris[1];
    if (lightFrame && darkFrame) {
      const response = await fetch(SERVER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          light: lightFrame,
          dark: darkFrame,
          zero_point: 20.0,
          exposure_time_s: 3,
          metadata: {
            location: "optional_location_info",
            timestamp: "optional_timestamp",
          },
        }),
      });

      const responseFormat = {
        median_sky_brightness_dn: 12.0,
        sky_quality_meter: 18.494850021680094,
      };

      if (!response.ok) {
        console.error("Failed to send images to server");
        setSQM(null);
        setError(
          "Failed to get sky quality meter reading, could not send images to server"
        );
      } else {
        const data: responseFormat = await response.json();
        setSQM(data.sky_quality_meter);
      }
    }
  };

  const renderPictures = (uris: string[]) => {
    return (
      <View style={styles.reviewContainer}>
        {uris.map((uri, idx) => (
          <View key={uri} style={styles.imageContainer}>
            <Image
              source={{ uri }}
              contentFit="cover"
              style={styles.previewImage}
              onError={(error) => {
                console.error(`Image load error for ${uri}:`, error);
                Alert.alert("Image Error", `Failed to load image: ${uri}`);
              }}
              onLoad={() => {
                console.log(`Image loaded successfully: ${uri}`);
              }}
            />
            <Text style={styles.imageLabel}>
              {idx === 0 ? "Light" : "Dark"} Frame
            </Text>
            <Text style={styles.debugText}>
              Platform: {Platform.OS} | URI: {uri.substring(uri.lastIndexOf('/') + 1)}
            </Text>
          </View>
        ))}
        {uris.length < 2 && (
          <Button
            onPress={() => {
              setMode("picture");
              setViewMode("camera");
            }}
            title={`${uris.length === 1 ? "Shield the lenses and " : ""}Take ${
              uris.length > 0 ? "dark" : "light"
            } frame`}
          />
        )}
        {uris.length === 2 && (
          <Button
            onPress={() => {
              sendToServer();
            }}
            title={`Check my sky quality`}
          />
        )}
        {SQM && (
          <Text style={{ textAlign: "center", marginTop: 20, fontSize: 18 }}>
            Your sky quality meter reading is {SQM.toFixed(2)}
          </Text>
        )}
        {error && (
          <Text
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: 18,
              color: "red",
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
      {viewMode === "review" && uris.length > 0
        ? renderPictures(uris)
        : renderCamera()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
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
  },
  imageLabel: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  debugText: {
    textAlign: "center",
    marginTop: 5,
    fontSize: 12,
    color: "#666",
  },
});
