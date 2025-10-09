import { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
  Alert,
  Platform,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

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

const BACKEND_URL =
  "https://australia-southeast2-popkorn-472305.cloudfunctions.net/get_measurements";

// Dark mode map styling
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#212121" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#212121" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1b1b1b" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [{ color: "#4e4e4e" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

export default function MapScreen() {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: -38.15, // Geelong area default
    longitude: 144.35,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [currentZoom, setCurrentZoom] = useState({
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

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
          setRegion({
            latitude: withLocation[0].location.latitude,
            longitude: withLocation[0].location.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
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

  // Calculate distance between two coordinates in kilometers
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

  // Calculate minimum distance threshold based on zoom level
  const getMinDistance = (latitudeDelta: number): number => {
    // More zoomed in = smaller latitudeDelta = smaller minimum distance
    // Adjust these values to tune the clustering behavior
    if (latitudeDelta > 1) return 5; // Very zoomed out: 5km spacing
    if (latitudeDelta > 0.5) return 2; // Zoomed out: 2km spacing
    if (latitudeDelta > 0.1) return 0.5; // Medium zoom: 500m spacing
    if (latitudeDelta > 0.05) return 0.2; // Zoomed in: 200m spacing
    return 0.05; // Very zoomed in: 50m spacing (show all)
  };

  // Filter markers to prevent overlapping based on current zoom
  const getVisibleMarkers = (): Measurement[] => {
    const minDistance = getMinDistance(currentZoom.latitudeDelta);
    const visible: Measurement[] = [];

    // Sort by SQM (show better quality readings preferentially)
    const sorted = [...measurements].sort(
      (a, b) => b.sky_quality_meter - a.sky_quality_meter
    );

    for (const measurement of sorted) {
      if (!measurement.location) continue;

      // Check if this marker is too close to any already visible marker
      const tooClose = visible.some((visibleMarker) => {
        if (!visibleMarker.location) return false;
        const distance = getDistance(
          measurement.location!.latitude,
          measurement.location!.longitude,
          visibleMarker.location.latitude,
          visibleMarker.location.longitude
        );
        return distance < minDistance;
      });

      if (!tooClose) {
        visible.push(measurement);
      }
    }

    return visible;
  };

  const handleRegionChangeComplete = (newRegion: typeof region) => {
    setCurrentZoom({
      latitudeDelta: newRegion.latitudeDelta,
      longitudeDelta: newRegion.longitudeDelta,
    });
  };

  const getMarkerColor = (sqm: number) => {
    // Color code based on SQM value
    // Darker skies (higher SQM) = better = green
    // Brighter skies (lower SQM) = worse = red
    if (sqm >= 21) return "#00ff00"; // Excellent (green)
    if (sqm >= 20) return "#88ff00"; // Good (yellow-green)
    if (sqm >= 19) return "#ffff00"; // Fair (yellow)
    if (sqm >= 18) return "#ff8800"; // Poor (orange)
    return "#ff0000"; // Very poor (red)
  };

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
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {getVisibleMarkers().map((measurement) => {
          if (!measurement.location) return null;

          const sqm = measurement.sky_quality_meter;

          return (
            <Marker
              key={measurement.id}
              coordinate={{
                latitude: measurement.location.latitude,
                longitude: measurement.location.longitude,
              }}
              anchor={{ x: 0.5, y: 1.5 }}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerCircle}>
                  <Text style={styles.markerText}>{sqm.toFixed(1)}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {measurements.length === 0 && (
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
  map: {
    flex: 1,
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
  markerContainer: {
    width: 80,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  markerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#ff0000",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    top: 0,
  },
  markerText: {
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
