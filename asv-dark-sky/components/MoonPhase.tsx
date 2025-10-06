import { useEffect, useState, Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import * as Location from "expo-location";
import {
  calculateMoonPhase,
  estimateMoonAltitude,
  getMoonImpactDescription,
  type MoonData,
} from "../utils/moonCalculations";

interface MoonPhaseData extends MoonData {
  emoji: string;
}

interface MoonPhaseProps {
  latitude?: number;
  longitude?: number;
}

export default function MoonPhase({ latitude, longitude }: MoonPhaseProps) {
  const [moonPhase, setMoonPhase] = useState<MoonPhaseData | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(latitude && longitude ? { latitude, longitude } : null);

  const getPhaseEmoji = (phase: string): string => {
    const emojiMap: { [key: string]: string } = {
      "New Moon": "🌑",
      "Waxing Crescent": "🌒",
      "First Quarter": "🌓",
      "Waxing Gibbous": "🌔",
      "Full Moon": "🌕",
      "Waning Gibbous": "🌖",
      "Last Quarter": "🌗",
      "Waning Crescent": "🌘",
    };
    return emojiMap[phase] || "🌕";
  };

  useEffect(() => {
    // Get location if not provided
    if (!location) {
      (async () => {
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === "granted") {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            });
            setLocation({
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            });
          }
        } catch (err) {
          console.error("Error getting location for moon phase:", err);
        }
      })();
    }
  }, [location]);

  useEffect(() => {
    const updateMoonPhase = () => {
      const now = new Date();
      const phaseData = calculateMoonPhase(now);

      let altitude: number | undefined;
      if (location) {
        altitude = estimateMoonAltitude(
          now,
          location.latitude,
          location.longitude
        );
      }

      const moonData: MoonPhaseData = {
        phase: phaseData.phase,
        illumination: phaseData.illumination,
        altitude,
        emoji: getPhaseEmoji(phaseData.phase),
      };

      setMoonPhase(moonData);
    };

    updateMoonPhase();

    // Update every 10 minutes
    const interval = setInterval(updateMoonPhase, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location]);

  if (!moonPhase) {
    return null;
  }

  const impactDescription = getMoonImpactDescription(moonPhase);
  const isAboveHorizon =
    moonPhase.altitude !== undefined && moonPhase.altitude > 0;

  return (
    <View style={styles.moonPhaseContainer}>
      <View style={styles.mainInfo}>
        <Text style={styles.moonPhaseEmoji}>{moonPhase.emoji}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.moonPhaseText}>
            {moonPhase.phase} ({moonPhase.illumination}% illuminated)
          </Text>
          {moonPhase.altitude !== undefined && (
            <Text style={styles.moonAltitudeText}>
              {isAboveHorizon
                ? `${moonPhase.altitude}° above horizon`
                : "Below horizon"}
            </Text>
          )}
          {isAboveHorizon && (
            <Text style={styles.moonImpactText}>{impactDescription}</Text>
          )}
        </View>
      </View>

      {moonPhase.altitude !== undefined && isAboveHorizon && (
        <View style={styles.altitudeArc}>
          <Svg width="100%" height="80" viewBox="0 0 200 80">
            {/* Curved sky arc */}
            <Path
              d="M 10 70 Q 100 -10, 190 70"
              stroke="#666"
              strokeWidth="2"
              fill="none"
              strokeDasharray="4,4"
            />

            {/* Horizon line */}
            <Line
              x1="10"
              y1="70"
              x2="190"
              y2="70"
              stroke="#444"
              strokeWidth="2"
            />

            {/* Degree markers */}
            {[
              { deg: 0, x: 10, y: 70, label: "E" },
              { deg: 30, x: 55, y: 45 },
              { deg: 60, x: 85, y: 20 },
              { deg: 90, x: 100, y: 10, label: "Zenith" },
              { deg: 60, x: 115, y: 20 },
              { deg: 30, x: 145, y: 45 },
              { deg: 0, x: 190, y: 70, label: "W" },
            ].map((point, idx) => (
              <Fragment key={idx}>
                <Circle cx={point.x} cy={point.y} r="2" fill="#888" />
                <SvgText
                  x={point.x}
                  y={point.y + 15}
                  fontSize="8"
                  fill="#888"
                  textAnchor="middle"
                >
                  {point.label || `${point.deg}°`}
                </SvgText>
              </Fragment>
            ))}

            {/* Moon position on arc */}
            {(() => {
              // Calculate position on the arc
              // Altitude 0° = sides (10 or 190), 90° = center top (100, 10)
              const altitudeRad = (moonPhase.altitude * Math.PI) / 180;
              const t = moonPhase.altitude / 90; // 0 to 1

              // Quadratic bezier curve calculation
              // Start: (10, 70), Control: (100, -10), End: (190, 70)
              const x =
                Math.pow(1 - t, 2) * 10 +
                2 * (1 - t) * t * 100 +
                Math.pow(t, 2) * 190;
              const y =
                Math.pow(1 - t, 2) * 70 +
                2 * (1 - t) * t * -10 +
                Math.pow(t, 2) * 70;

              return (
                <>
                  <Circle cx={x} cy={y} r="6" fill="#ff6b6b" opacity="0.3" />
                  <SvgText
                    x={x}
                    y={y + 1}
                    fontSize="12"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {moonPhase.emoji}
                  </SvgText>
                </>
              );
            })()}
          </Svg>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  moonPhaseContainer: {
    position: "absolute",
    bottom: 0,
    alignItems: "center",
    padding: 12,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    borderColor: "#ff0000",
    borderWidth: 0,
    backgroundColor: "#222",
    width: "90%",
    marginHorizontal: "auto",
  },
  mainInfo: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 8,
  },
  moonPhaseEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  moonPhaseText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 3,
  },
  moonAltitudeText: {
    color: "#bfbfbf",
    fontSize: 12,
    marginBottom: 2,
  },
  moonImpactText: {
    color: "#ff6b6b",
    fontSize: 11,
    fontStyle: "italic",
  },
  altitudeArc: {
    width: "100%",
    height: 80,
    marginTop: 12,
    alignItems: "center",
  },
});
