import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import MapboxHeatmapView, {
  HeatmapPoint as MapboxHeatmapPoint,
} from "../components/MapboxHeatmapView";

interface Measurement {
  id: string;
  sky_quality_meter: number;
  median_sky_brightness_dn: number;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  created_at: string;
}

interface HeatmapPoint extends MapboxHeatmapPoint {
  label: string;
  timestamp?: string; // Optional timestamp for prioritizing recent readings
}

const BACKEND_URL =
  "https://australia-southeast2-popkorn-472305.cloudfunctions.net/get_measurements";

// Default map settings
const DEFAULT_CENTER = { latitude: -37.6, longitude: 144.8 };
const DEFAULT_RADIUS_KM = 50;

// Mock data for testing heatmap - Melbourne region and dark sky sites
// Timestamps simulate measurements over several months
const mockHeatmapData: HeatmapPoint[] = [
  // Melbourne CBD - High light pollution (recent measurements)
  {
    latitude: -37.8136,
    longitude: 144.9631,
    intensity: 1.0,
    sqm: 15.5,
    label: "Melbourne CBD",
    timestamp: "2025-10-12T20:30:00.000Z", // Tonight
  },
  {
    latitude: -37.82,
    longitude: 144.97,
    intensity: 0.95,
    sqm: 16.0,
    label: "South Melbourne",
    timestamp: "2025-10-11T21:15:00.000Z", // Last night
  },
  {
    latitude: -37.8,
    longitude: 144.95,
    intensity: 0.9,
    sqm: 16.5,
    label: "North Melbourne",
    timestamp: "2025-10-10T22:00:00.000Z", // 2 days ago
  },

  // Inner suburbs - Medium-high pollution (1 week old)
  {
    latitude: -37.7749,
    longitude: 144.9441,
    intensity: 0.8,
    sqm: 17.2,
    label: "Brunswick",
    timestamp: "2025-10-05T21:30:00.000Z", // 1 week ago
  },
  {
    latitude: -37.8477,
    longitude: 144.9633,
    intensity: 0.75,
    sqm: 17.5,
    label: "South Yarra",
    timestamp: "2025-10-04T20:45:00.000Z",
  },
  {
    latitude: -37.7879,
    longitude: 145.0123,
    intensity: 0.7,
    sqm: 17.8,
    label: "Richmond",
    timestamp: "2025-10-03T22:30:00.000Z",
  },

  // Outer suburbs - Medium pollution (2-3 weeks old)
  {
    latitude: -37.7228,
    longitude: 144.8501,
    intensity: 0.6,
    sqm: 18.5,
    label: "Geelong",
    timestamp: "2025-09-28T21:00:00.000Z", // 2 weeks ago
  },
  {
    latitude: -37.8814,
    longitude: 145.1383,
    intensity: 0.55,
    sqm: 18.8,
    label: "Dandenong",
    timestamp: "2025-09-25T20:15:00.000Z",
  },
  {
    latitude: -37.6872,
    longitude: 145.0421,
    intensity: 0.5,
    sqm: 19.2,
    label: "Whittlesea",
    timestamp: "2025-09-20T21:45:00.000Z", // 3 weeks ago
  },

  // Regional areas - Lower pollution (1 month old)
  {
    latitude: -37.5622,
    longitude: 144.9044,
    intensity: 0.3,
    sqm: 20.1,
    label: "Kilmore",
    timestamp: "2025-09-12T22:00:00.000Z", // 1 month ago
  },
  {
    latitude: -37.4713,
    longitude: 144.7852,
    intensity: 0.25,
    sqm: 20.5,
    label: "Romsey",
    timestamp: "2025-09-08T21:30:00.000Z",
  },

  // Leon Mow Dark Sky Site - Very low pollution (multiple measurements to test clustering)
  {
    latitude: -37.3903,
    longitude: 144.7664,
    intensity: 0.1,
    sqm: 21.2,
    label: "Leon Mow Dark Sky Site",
    timestamp: "2025-10-12T23:00:00.000Z", // Most recent - should be displayed
  },
  {
    latitude: -37.3905, // Slightly different location (nearby)
    longitude: 144.7662,
    intensity: 0.12,
    sqm: 21.0,
    label: "Leon Mow (older)",
    timestamp: "2025-09-15T22:00:00.000Z", // Older measurement - should be clustered
  },

  // Remote dark sky areas - Minimal pollution
  {
    latitude: -37.25,
    longitude: 144.5,
    intensity: 0.05,
    sqm: 21.8,
    label: "Remote Dark Sky",
    timestamp: "2025-08-20T23:30:00.000Z", // 2 months ago
  },
  {
    latitude: -37.1,
    longitude: 144.3,
    intensity: 0.02,
    sqm: 22.1,
    label: "Pristine Dark Sky",
    timestamp: "2025-08-15T22:45:00.000Z", // 2 months ago
  },
];

export default function MapScreen() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMockData, setShowMockData] = useState(false); // Toggle for testing
  const [showLegend, setShowLegend] = useState(true); // Toggle legend visibility
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState(DEFAULT_RADIUS_KM);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}?limit=100`);
      const data = await response.json();

      if (data.measurements) {
        // Filter out measurements without location data
        const withLocation = data.measurements.filter(
          (m: Measurement) => m.location !== null
        );
        setMeasurements(withLocation);

        // Center map on first measurement if available
        if (withLocation.length > 0 && withLocation[0].location) {
          setMapCenter({
            latitude: withLocation[0].location.latitude,
            longitude: withLocation[0].location.longitude,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching measurements:", error);
      Alert.alert(
        "Error",
        "Failed to load measurements. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchMeasurements();
    }, [])
  );

  // Convert SQM to intensity (0-1 scale where 1 = high light pollution)
  const sqmToIntensity = (sqm: number): number => {
    // SQM scale typically ranges from ~15 (city) to ~22 (pristine)
    // Convert to 0-1 intensity where 1 = highest pollution (lowest SQM)
    const clampedSqm = Math.max(15, Math.min(22, sqm));
    return (22 - clampedSqm) / 7; // Normalize to 0-1
  };

  // Get color for light pollution intensity (used by legend)
  const getHeatmapColor = (intensity: number): string => {
    // Create gradient from green (low pollution) to red (high pollution)
    const red = Math.round(intensity * 255);
    const green = Math.round((1 - intensity) * 255);
    const blue = 0;
    return `rgb(${red}, ${green}, ${blue})`;
  };

  // Calculate distance between two coordinates in km
  const getDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Cluster nearby points - use most recent reading instead of averaging
  const clusterHeatmapPoints = (points: HeatmapPoint[]): HeatmapPoint[] => {
    if (points.length === 0) return [];

    const clustered: HeatmapPoint[] = [];
    const used = new Set<number>();
    const clusterThreshold = 3; // Cluster points within 3km

    console.log(`[Clustering] Starting with ${points.length} points`);

    // Process all points
    points.forEach((point, index) => {
      if (used.has(index)) return;

      // Find all nearby points (regardless of intensity - location is primary factor)
      const nearbyPoints = points
        .map((p, i) => ({ point: p, index: i }))
        .filter(({ point: p, index: i }) => {
          if (used.has(i)) return false;

          const distance = getDistance(
            point.latitude,
            point.longitude,
            p.latitude,
            p.longitude
          );

          // Cluster based purely on proximity (distance in km)
          return distance < clusterThreshold;
        });

      if (nearbyPoints.length > 0) {
        console.log(
          `[Clustering] Found ${
            nearbyPoints.length
          } nearby points for location (${point.latitude.toFixed(
            4
          )}, ${point.longitude.toFixed(4)})`
        );

        // Find the most recent reading in the cluster
        let mostRecent = nearbyPoints[0];

        if (nearbyPoints.length > 1) {
          // Log timestamps for debugging
          nearbyPoints.forEach(({ point: p }) => {
            console.log(
              `  - ${p.label}: ${p.timestamp || "no timestamp"}, SQM: ${p.sqm}`
            );
          });

          mostRecent = nearbyPoints.reduce((latest, current) => {
            // If no timestamps, keep first point
            if (!current.point.timestamp || !latest.point.timestamp) {
              return latest;
            }
            const currentTime = new Date(current.point.timestamp).getTime();
            const latestTime = new Date(latest.point.timestamp).getTime();
            return currentTime > latestTime ? current : latest;
          }, nearbyPoints[0]);

          console.log(
            `  → Selected most recent: ${mostRecent.point.label} (${mostRecent.point.timestamp})`
          );
        }

        // Use the most recent reading's data
        clustered.push({
          latitude: mostRecent.point.latitude,
          longitude: mostRecent.point.longitude,
          intensity: mostRecent.point.intensity,
          sqm: mostRecent.point.sqm,
          label:
            nearbyPoints.length > 1
              ? `${mostRecent.point.label} (${nearbyPoints.length} readings)`
              : mostRecent.point.label,
          timestamp: mostRecent.point.timestamp,
        });

        // Mark all points in cluster as used
        nearbyPoints.forEach(({ index: i }) => {
          used.add(i);
        });
      }
    });

    console.log(
      `[Clustering] Reduced from ${points.length} to ${clustered.length} points`
    );
    return clustered;
  };

  // Convert real measurements to heatmap points
  const convertMeasurementsToHeatmap = (): HeatmapPoint[] => {
    return measurements
      .filter((m) => m.location)
      .map((m) => ({
        latitude: m.location!.latitude,
        longitude: m.location!.longitude,
        intensity: sqmToIntensity(m.sky_quality_meter),
        sqm: m.sky_quality_meter,
        label: `SQM ${m.sky_quality_meter.toFixed(1)}`,
        timestamp: m.created_at,
      }));
  };

  // Prepare heatmap data (must be before any conditional returns for hooks)
  const heatmapData = showMockData
    ? mockHeatmapData
    : convertMeasurementsToHeatmap();

  // Apply clustering to reduce rendering load (useMemo must be called unconditionally)
  const clusteredData = React.useMemo(
    () => clusterHeatmapPoints(heatmapData),
    [heatmapData]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Loading measurements...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapboxHeatmapView
        points={clusteredData}
        centerLat={mapCenter.latitude}
        centerLng={mapCenter.longitude}
        radiusKm={radiusKm}
        smoothness={80}
        threshold={0.15}
        opacity={0.7}
      />

      {/* Show Scale Button - only visible when legend is hidden */}
      {!showLegend && (
        <View style={styles.showScaleContainer}>
          <TouchableOpacity
            style={styles.showScaleButton}
            onPress={() => setShowLegend(true)}
          >
            <Text style={styles.showScaleText}>Show Scale</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Legend */}
      {showLegend && (
        <View style={styles.legendContainer}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendTitle}>Light Pollution Scale</Text>
            <TouchableOpacity
              style={styles.legendToggleButton}
              onPress={() => setShowLegend(!showLegend)}
            >
              <Text style={styles.legendToggleText}>Hide</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.legendBar}>
            <View style={styles.legendGradient}>
              {[0, 0.25, 0.5, 0.75, 1.0].map((intensity, index) => (
                <View
                  key={index}
                  style={[
                    styles.legendSegment,
                    { backgroundColor: getHeatmapColor(intensity) },
                  ]}
                />
              ))}
            </View>
            <View style={styles.legendLabels}>
              <Text style={styles.legendLabel}>Dark Sky</Text>
              <Text style={styles.legendLabel}>City</Text>
            </View>
          </View>
          {showMockData && (
            <Text style={styles.legendNote}>
              Showing mock data for Melbourne region
            </Text>
          )}
        </View>
      )}

      {measurements.length === 0 && !showMockData && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No measurements with location data
          </Text>
          <Text style={styles.noDataSubtext}>
            Take photos with location enabled to see them on the map
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#ff0000",
    fontSize: 16,
    marginTop: 10,
  },
  legendContainer: {
    position: "absolute",
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 10,
    padding: 15,
    borderColor: "#ff0000",
    borderWidth: 1,
  },
  legendHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  legendTitle: {
    color: "#ff0000",
    fontSize: 14,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  legendToggleButton: {
    backgroundColor: "rgba(255, 0, 0, 0.1)",
    borderColor: "#ff0000",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    position: "absolute",
    right: 0,
  },
  legendToggleText: {
    color: "#ff0000",
    fontSize: 10,
    fontWeight: "bold",
  },
  legendBar: {
    marginBottom: 5,
  },
  legendGradient: {
    flexDirection: "row",
    height: 20,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 5,
  },
  legendSegment: {
    flex: 1,
  },
  legendLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendLabel: {
    color: "#ff0000",
    fontSize: 12,
  },
  legendNote: {
    color: "#ff0000",
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
    fontStyle: "italic",
  },
  showScaleContainer: {
    position: "absolute",
    bottom: 100,
    right: 20,
    zIndex: 10,
  },
  showScaleButton: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderColor: "#ff0000",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  showScaleText: {
    color: "#ff0000",
    fontSize: 11,
    fontWeight: "bold",
  },
  noDataContainer: {
    position: "absolute",
    top: "40%",
    left: 0,
    right: 0,
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    marginHorizontal: 20,
    borderRadius: 10,
    borderColor: "#ff0000",
    borderWidth: 1,
  },
  noDataText: {
    color: "#ff0000",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  noDataSubtext: {
    color: "#ff0000",
    fontSize: 14,
    textAlign: "center",
  },
});
