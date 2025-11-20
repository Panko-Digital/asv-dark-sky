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
const DEFAULT_RADIUS_KM = 150; // Increased to 150km for wider view

// Generate randomized test data with two distinct separated areas
const generateRandomTestData = (): HeatmapPoint[] => {
  const points: HeatmapPoint[] = [];
  
  // Helper to convert SQM to intensity
  const sqmToIntensity = (sqm: number): number => {
    const clampedSqm = Math.max(15, Math.min(24, sqm));
    return (24 - clampedSqm) / 9; // Normalize to 0-1
  };
  
  // AREA 1: Left side - Urban/Suburban (worse sky quality)
  const leftAreaClusters = [
    // Top-left: Poor urban sky (SQM 16-18) - dense
    { lat: -37.3, lng: 144.4, count: 14, sqmMin: 16, sqmMax: 18, spread: 0.12 },
    
    // Bottom-left: Moderate suburban (SQM 18-20) - medium
    { lat: -37.8, lng: 144.5, count: 10, sqmMin: 18, sqmMax: 20, spread: 0.15 },
  ];
  
  // AREA 2: Right side - Rural/Remote (better sky quality)
  const rightAreaClusters = [
    // Top-right: Good rural sky (SQM 20-22) - sparse
    { lat: -37.35, lng: 145.15, count: 8, sqmMin: 20, sqmMax: 22, spread: 0.13 },
    
    // Bottom-right: Excellent dark sky (SQM 22-24) - very sparse
    { lat: -37.85, lng: 145.2, count: 6, sqmMin: 22, sqmMax: 24, spread: 0.1 },
  ];
  
  let id = 0;
  
  // Generate left area points
  leftAreaClusters.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      // Random offset with Gaussian distribution for organic clustering
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.sqrt(-2 * Math.log(Math.random() + 0.01)) * cluster.spread * 0.4;
      
      const lat = cluster.lat + distance * Math.cos(angle);
      const lng = cluster.lng + distance * Math.sin(angle);
      
      // Random SQM within cluster range
      const sqm = cluster.sqmMin + Math.random() * (cluster.sqmMax - cluster.sqmMin);
      
      points.push({
        latitude: lat,
        longitude: lng,
        intensity: sqmToIntensity(sqm),
        sqm: parseFloat(sqm.toFixed(1)),
        label: `Urban ${id++} (${sqm.toFixed(1)})`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  // Generate right area points
  rightAreaClusters.forEach(cluster => {
    for (let i = 0; i < cluster.count; i++) {
      // Random offset with Gaussian distribution
      const angle = Math.random() * 2 * Math.PI;
      const distance = Math.sqrt(-2 * Math.log(Math.random() + 0.01)) * cluster.spread * 0.4;
      
      const lat = cluster.lat + distance * Math.cos(angle);
      const lng = cluster.lng + distance * Math.sin(angle);
      
      // Random SQM within cluster range
      const sqm = cluster.sqmMin + Math.random() * (cluster.sqmMax - cluster.sqmMin);
      
      points.push({
        latitude: lat,
        longitude: lng,
        intensity: sqmToIntensity(sqm),
        sqm: parseFloat(sqm.toFixed(1)),
        label: `Rural ${id++} (${sqm.toFixed(1)})`,
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  console.log(`Generated ${points.length} random test points in 2 distinct areas (left: urban, right: rural)`);
  return points;
};

const mockHeatmapData: HeatmapPoint[] = generateRandomTestData();

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

  // Convert SQM to intensity (0-1 scale where 1 = worst/red, 0 = best/green)
  const sqmToIntensity = (sqm: number): number => {
    // SQM scale: <20 = red (bad), 20-22 = amber (ok), 22+ = green (good)
    // Reversed: high SQM (good sky) = low intensity (green)
    //          low SQM (bad sky) = high intensity (red)
    const clampedSqm = Math.max(15, Math.min(22, sqm));
    return (22 - clampedSqm) / 7; // Normalize to 0-1 (still correct)
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

  // No clustering - show all individual measurements

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
        points={heatmapData}
        centerLat={mapCenter.latitude}
        centerLng={mapCenter.longitude}
        radiusKm={150}
        smoothness={25}
        threshold={0.5}
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
              Showing randomized test data with full SQM range (16-24)
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
    backgroundColor: "transparent",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "transparent",
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
