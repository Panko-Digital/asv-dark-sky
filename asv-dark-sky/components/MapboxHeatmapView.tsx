import React, { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import MapboxGL from "@rnmapbox/maps";

// Initialize Mapbox access token from environment variable
// Note: Mapbox tokens are public tokens safe for client-side use
const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY;

if (MAPBOX_API_KEY) {
  MapboxGL.setAccessToken(MAPBOX_API_KEY);
} else {
  console.warn("Mapbox API key not found. Please set EXPO_PUBLIC_MAPBOX_API_KEY in your .env file");
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  intensity: number; // 0-1, where 1 is highest light pollution
  sqm: number;
}

interface MapboxHeatmapViewProps {
  points: HeatmapPoint[];
  centerLat: number;
  centerLng: number;
  radiusKm?: number;
  smoothness?: number; // Not used in native Mapbox, but kept for compatibility
  threshold?: number; // Not used in native Mapbox, but kept for compatibility
  opacity?: number; // 0-1, heatmap transparency
}

export default function MapboxHeatmapView({
  points,
  centerLat,
  centerLng,
  radiusKm = 150,
  opacity = 0.7,
}: MapboxHeatmapViewProps) {
  // Convert points to GeoJSON format for Mapbox
  const geoJsonData = useMemo(() => {
    if (points.length === 0) {
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }

    return {
      type: "FeatureCollection" as const,
      features: points.map((point) => ({
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude],
        },
        properties: {
          // Mapbox heatmap uses 'mag' or custom property for weight
          // We'll use intensity (0-1) mapped to a weight value
          // Higher intensity (more pollution) = higher weight
          mag: point.intensity,
          sqm: point.sqm,
        },
      })),
    };
  }, [points]);

  // Calculate zoom level based on radius
  const zoomLevel = useMemo(() => {
    // Approximate zoom calculation: larger radius = lower zoom
    if (radiusKm >= 200) return 6;
    if (radiusKm >= 100) return 7;
    if (radiusKm >= 50) return 8;
    if (radiusKm >= 25) return 9;
    return 10;
  }, [radiusKm]);

  if (!MAPBOX_API_KEY) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataOverlay}>
          <Text style={styles.noDataText}>Mapbox API key not configured</Text>
          <Text style={styles.noDataSubtext}>
            Please set EXPO_PUBLIC_MAPBOX_API_KEY in your .env file
          </Text>
        </View>
      </View>
    );
  }

  if (points.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataOverlay}>
          <Text style={styles.noDataText}>No measurement data</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        style={styles.map}
        styleURL={MapboxGL.StyleURL.Dark} // Dark theme similar to dark-v11
      >
        <MapboxGL.Camera
          zoomLevel={zoomLevel}
          centerCoordinate={[centerLng, centerLat]}
          animationMode="none"
        />

        <MapboxGL.ShapeSource id="heatmapSource" shape={geoJsonData}>
          {/* Heatmap layer - shows at lower zoom levels */}
          <MapboxGL.HeatmapLayer
            id="heatmapLayer"
            style={{
              // Heatmap weight based on SQM values directly
              // Higher SQM (better sky) = higher weight = contributes more to density
              // This ensures clusters of good SQM values create higher weighted density
              heatmapWeight: [
                "interpolate",
                ["linear"],
                ["get", "sqm"],
                15,
                0.1, // SQM 15 (worst) = low weight
                18,
                0.3, // SQM 18 (poor) = medium-low weight
                20,
                0.5, // SQM 20 (moderate) = medium weight
                22,
                0.8, // SQM 22 (good) = high weight
                24,
                1.0, // SQM 24 (excellent) = highest weight
              ],
              // Heatmap intensity increases with zoom
              heatmapIntensity: [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                1,
                9,
                3,
              ],
              // Color gradient based on SQM-weighted density
              // Density is now weighted by SQM values, so clusters of similar SQM blend correctly
              // Color stops map weighted density to SQM ranges: 0.0 (SQM 15/worst) → 1.0 (SQM 24/excellent)
              heatmapColor: [
                "interpolate",
                ["linear"],
                ["heatmap-density"],
                0,
                "rgba(255, 0, 0, 0)", // Transparent red at edges (SQM 15 - worst)
                0.1,
                "rgb(255, 0, 0)", // Red - worst light pollution (SQM 15-16)
                0.25,
                "rgb(255, 100, 0)", // Red-orange - very poor (SQM 16-18)
                0.5,
                "rgb(255, 165, 0)", // Orange - poor (SQM 18-20)
                0.75,
                "rgb(255, 255, 0)", // Yellow/Amber - moderate (SQM 20-22)
                1,
                "rgb(0, 255, 0)", // Green - good dark sky (SQM 22-24)
              ],
              // Heatmap radius adjusts with zoom
              heatmapRadius: [
                "interpolate",
                ["linear"],
                ["zoom"],
                0,
                2,
                9,
                20,
              ],
              // Heatmap opacity
              heatmapOpacity: opacity,
            }}
          />

          {/* Circle layer - shows individual points at higher zoom levels */}
          <MapboxGL.CircleLayer
            id="circleLayer"
            style={{
              // Circle radius based on zoom and SQM value
              circleRadius: [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                ["interpolate", ["linear"], ["get", "sqm"], 15, 1, 24, 4],
                16,
                ["interpolate", ["linear"], ["get", "sqm"], 15, 5, 24, 50],
              ],
              // Circle color based on SQM value directly
              // Maps SQM ranges to colors matching the heatmap
              circleColor: [
                "interpolate",
                ["linear"],
                ["get", "sqm"],
                15,
                "rgba(255, 0, 0, 0.8)", // Red - worst (SQM 15)
                18,
                "rgb(255, 100, 0)", // Red-orange - very poor (SQM 18)
                20,
                "rgb(255, 165, 0)", // Orange - poor (SQM 20)
                22,
                "rgb(255, 255, 0)", // Yellow/Amber - moderate (SQM 22)
                24,
                "rgba(0, 255, 0, 0.8)", // Green - good (SQM 24)
              ],
              circleStrokeColor: "white",
              circleStrokeWidth: 1,
              // Transition from heatmap to circles at zoom 7-8
              circleOpacity: [
                "interpolate",
                ["linear"],
                ["zoom"],
                7,
                0,
                8,
                1,
              ],
            }}
          />

          {/* Symbol layer - shows SQM text labels at higher zoom levels */}
          <MapboxGL.SymbolLayer
            id="sqmLabelLayer"
            style={{
              // Display SQM value as text
              textField: [
                "to-string",
                ["round", ["get", "sqm"]],
              ],
              // Text size interpolates from zoom 10 (0 size) to zoom 12 (12px)
              textSize: [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                0,
                12,
                12,
              ],
              // Text color - white for visibility on colored circles
              textColor: "white",
              // Text halo for better contrast
              textHaloColor: "rgba(0, 0, 0, 0.8)",
              textHaloWidth: 1,
              // Allow text to overlap so all labels are visible
              textAllowOverlap: true,
              // Match visibility with circle layer (visible at zoom 8+)
              textOpacity: [
                "interpolate",
                ["linear"],
                ["zoom"],
                8,
                0,
                10,
                1,
              ],
            }}
          />
        </MapboxGL.ShapeSource>
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  map: {
    flex: 1,
  },
  noDataOverlay: {
    position: "absolute",
    top: "40%",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
    borderRadius: 10,
    borderColor: "#ff0000",
    borderWidth: 1,
    alignItems: "center",
    zIndex: 1000,
  },
  noDataText: {
    color: "#ff0000",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  noDataSubtext: {
    color: "#ff0000",
    fontSize: 12,
    textAlign: "center",
  },
});
