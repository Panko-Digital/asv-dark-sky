import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Accelerometer, AccelerometerMeasurement } from "expo-sensors";

interface TiltIndicatorProps {
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const TiltIndicator: React.FC<TiltIndicatorProps> = ({
  position = "top-right",
}) => {
  const [tiltAngle, setTiltAngle] = useState<number>(0);

  useEffect(() => {
    // Set update interval to 100ms for smooth updates
    Accelerometer.setUpdateInterval(100);

    const subscription = Accelerometer.addListener(
      (accelerometerData: AccelerometerMeasurement) => {
        const { x, y, z } = accelerometerData;

        // Calculate the tilt angle from vertical (0° = phone upright, 90° = phone horizontal)
        // Using the z-axis (gravity) to determine tilt from vertical
        const gravityMagnitude = Math.sqrt(x * x + y * y + z * z);
        const normalizedZ = z / gravityMagnitude;

        // Calculate angle from vertical in degrees
        const angleFromVertical = Math.acos(normalizedZ) * (180 / Math.PI);

        setTiltAngle(Math.round(angleFromVertical));
      }
    );

    return () => subscription.remove();
  }, []);

  const getPositionStyle = () => {
    switch (position) {
      case "top-left":
        return { top: 80, left: 20 };
      case "bottom-right":
        return { bottom: 120, right: 20 };
      case "bottom-left":
        return { bottom: 120, left: 20 };
      case "top-right":
      default:
        return { top: 80, right: 20 };
    }
  };

  // Determine color based on angle (green when flat/pointing at sky, red when upright, sky is 0 on ios but 180 on android)
  const getIndicatorColor = () => {
    if (tiltAngle <= 15 || tiltAngle >= 165) return "#00ff00"; // Green - flat/pointing at sky (good for sky photos)
    if (tiltAngle <= 45 || tiltAngle >= 135) return "#ffaa00"; // Orange - moderate tilt
    return "#ff0000"; // Red - upright/vertical (bad for sky photos)
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      <View
        style={[
          styles.circle,
          {
            borderColor: getIndicatorColor(),
            shadowColor: getIndicatorColor(),
          },
        ]}
      >
        <Text style={[styles.angle, { color: getIndicatorColor() }]}>
          {tiltAngle}°
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 200,
  },
  circle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  angle: {
    fontSize: 20,
    fontWeight: "bold",
  },
});

export default TiltIndicator;
