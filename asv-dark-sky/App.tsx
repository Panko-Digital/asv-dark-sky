import {
  CameraMode,
  CameraType,
  CameraView,
  useCameraPermissions,
} from "expo-camera";
import { useRef, useState } from "react";
import { Button, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
// import AntDesign from "@expo/vector-icons/AntDesign";
// import Feather from "@expo/vector-icons/Feather";
// import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export type ViewMode = "camera" | "review";

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [uris, setUris] = useState<string[]>([]);
  const [mode, setMode] = useState<CameraMode>("picture");
  const [viewMode, setViewMode] = useState<ViewMode>("camera");
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
    const photo = await ref.current?.takePictureAsync();
    if (photo?.uri) setUris((prev) => [...prev, photo.uri]);
    setViewMode("review");
  };

  const renderPictures = (uris: string[]) => {
    return (
      <View>
        {uris.map((uri, idx) => (
          <div key={uri}>
            <Image
              key={uri}
              source={{ uri }}
              contentFit="cover"
              style={{
                width: 300,
                height: 300,
                borderRadius: "50%",
                aspectRatio: 1,
              }}
            />
            <p style={{ textAlign: "center" }}>
              {idx === 0 ? "Light" : "Dark"} Frame
            </p>
          </div>
        ))}
        {uris.length < 2 && (
          <Button
            onPress={() => {
              setMode("picture");
              setViewMode("camera");
            }}
            title={`Take ${uris.length > 0 ? "dark" : "light"} frame`}
          />
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
});
