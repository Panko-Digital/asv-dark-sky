import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Image as RNImage,
  ActivityIndicator,
  Text,
} from "react-native";
import {
  Canvas,
  Image,
  Skia,
  useImage,
  SkImage,
} from "@shopify/react-native-skia";

const MAPBOX_API_KEY =
  "pk.eyJ1IjoicGFua29kaWdpdGFsYXBwcyIsImEiOiJjbWk3NndmbmwwM3BoMmxwd2ZoajZtanI0In0.uJaQMDQLzD-oD6jAO3CT5w";

interface HeatmapImageData {
  width: number;
  height: number;
  data: Uint8Array;
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
  smoothness?: number; // 20-200, controls gradient smoothness
  threshold?: number; // 0.05-0.5, minimum intensity to display
  opacity?: number; // 0-1, heatmap transparency
}

export default function MapboxHeatmapView({
  points,
  centerLat,
  centerLng,
  radiusKm = 50,
  smoothness = 80,
  threshold = 0.15,
  opacity = 0.7,
}: MapboxHeatmapViewProps) {
  const { width: screenWidth } = Dimensions.get("window");
  const width = screenWidth;
  const height = screenWidth; // Square map for simplicity

  const [mapUrl, setMapUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapImageData | null>(null);

  // Calculate appropriate zoom level based on radius
  const zoom = useMemo(() => {
    // Mapbox zoom: each level doubles the scale
    // Approximate formula to fit radius in view
    const metersPerPixel = (radiusKm * 2000) / width;
    const zoom = Math.log2(40075016.686 / (metersPerPixel * 256));
    return Math.max(1, Math.min(20, Math.floor(zoom)));
  }, [radiusKm, width]);

  // Generate Mapbox static image URL
  useEffect(() => {
    const url = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${centerLng},${centerLat},${zoom}/${width}x${height}@2x?access_token=${MAPBOX_API_KEY}`;
    setMapUrl(url);
  }, [centerLat, centerLng, zoom, width, height]);

  // Calculate distance between two coordinates in km
  const getDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number => {
    const dLat = (lat2 - lat1) * 111.32;
    const dLng =
      (lng2 - lng1) * 111.32 * Math.cos((((lat1 + lat2) / 2) * Math.PI) / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  // Convert pixel coordinates to lat/lng
  const pixelToLatLng = (x: number, y: number) => {
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);
    const scale = Math.min(width, height) / (radiusKm * 2);
    const deltaLng = (x - width / 2) / scale;
    const deltaLat = -(y - height / 2) / scale;
    const lat = centerLat + deltaLat / kmPerDegreeLat;
    const lng = centerLng + deltaLng / kmPerDegreeLng;
    return { lat, lng };
  };

  // Metaball field calculation with Gaussian falloff
  const calculateMetaballField = (lat: number, lng: number): number => {
    let sum = 0;

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const distance = getDistance(lat, lng, point.latitude, point.longitude);

      // Gaussian-like falloff for smooth organic shapes
      const contribution = point.intensity * Math.exp(-distance / smoothness);
      sum += contribution;
    }

    return sum;
  };

  // Color interpolation from green (low) to yellow to red (high)
  const interpolateColor = (
    value: number
  ): { r: number; g: number; b: number; a: number } => {
    value = Math.max(0, Math.min(1, value));
    let r: number, g: number, b: number;

    if (value < 0.33) {
      const t = value / 0.33;
      r = Math.round(t * 255);
      g = 255;
      b = 0;
    } else if (value < 0.66) {
      const t = (value - 0.33) / 0.33;
      r = 255;
      g = Math.round(255 - t * 100);
      b = 0;
    } else {
      const t = (value - 0.66) / 0.34;
      r = 255;
      g = Math.round(155 * (1 - t));
      b = 0;
    }

    return { r, g, b, a: Math.round(opacity * 255) };
  };

  // Generate heatmap data
  useEffect(() => {
    if (points.length === 0) {
      setLoading(false);
      return;
    }

    const generateHeatmap = async () => {
      setLoading(true);

      // Use lower resolution grid for performance
      const step = 3; // Reduced from 2 for better performance on mobile
      const gridWidth = Math.ceil(width / step);
      const gridHeight = Math.ceil(height / step);
      const field = new Float32Array(gridWidth * gridHeight);

      // Calculate field values for entire grid
      for (let gy = 0; gy < gridHeight; gy++) {
        for (let gx = 0; gx < gridWidth; gx++) {
          const x = gx * step;
          const y = gy * step;
          const { lat, lng } = pixelToLatLng(x, y);
          const value = calculateMetaballField(lat, lng);
          field[gy * gridWidth + gx] = value;
        }
      }

      // Find min/max for normalization
      let minVal = Infinity;
      let maxVal = -Infinity;
      for (let i = 0; i < field.length; i++) {
        if (field[i] > threshold) {
          minVal = Math.min(minVal, field[i]);
          maxVal = Math.max(maxVal, field[i]);
        }
      }

      // Create image data with bilinear interpolation
      const imageData: HeatmapImageData = {
        width,
        height,
        data: new Uint8Array(width * height * 4),
      };

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const gx = x / step;
          const gy = y / step;
          const gx0 = Math.floor(gx);
          const gy0 = Math.floor(gy);
          const gx1 = Math.min(gx0 + 1, gridWidth - 1);
          const gy1 = Math.min(gy0 + 1, gridHeight - 1);

          // Bilinear interpolation
          const fx = gx - gx0;
          const fy = gy - gy0;

          const v00 = field[gy0 * gridWidth + gx0];
          const v10 = field[gy0 * gridWidth + gx1];
          const v01 = field[gy1 * gridWidth + gx0];
          const v11 = field[gy1 * gridWidth + gx1];

          const v0 = v00 * (1 - fx) + v10 * fx;
          const v1 = v01 * (1 - fx) + v11 * fx;
          const value = v0 * (1 - fy) + v1 * fy;

          if (value > threshold && maxVal > minVal) {
            // Normalize to 0-1 range
            const normalized = (value - minVal) / (maxVal - minVal);

            // Apply edge feathering
            let edgeFade = 1;
            const edgeDistance = 30;
            const distToEdge = Math.min(x, y, width - x, height - y);
            if (distToEdge < edgeDistance) {
              edgeFade = distToEdge / edgeDistance;
            }

            // Soft threshold fade
            const softThreshold = threshold * 1.5;
            let thresholdFade = 1;
            if (value < softThreshold) {
              thresholdFade = (value - threshold) / (softThreshold - threshold);
            }

            const finalValue = normalized * edgeFade * thresholdFade;
            const color = interpolateColor(finalValue);

            const idx = (y * width + x) * 4;
            imageData.data[idx] = color.r;
            imageData.data[idx + 1] = color.g;
            imageData.data[idx + 2] = color.b;
            imageData.data[idx + 3] = color.a;
          }
        }
      }

      setHeatmapData(imageData);
      setLoading(false);
    };

    generateHeatmap();
  }, [
    points,
    centerLat,
    centerLng,
    radiusKm,
    smoothness,
    threshold,
    opacity,
    width,
    height,
  ]);

  // Create Skia image from heatmap data
  const heatmapImage = useMemo(() => {
    if (!heatmapData) return null;

    const skiaData = Skia.Data.fromBytes(heatmapData.data);
    return Skia.Image.MakeImage(
      {
        width: heatmapData.width,
        height: heatmapData.height,
        alphaType: 1, // kPremul_SkAlphaType
        colorType: 5, // kRGBA_8888_SkColorType
      },
      skiaData,
      heatmapData.width * 4
    );
  }, [heatmapData]);

  const mapImage = useImage(mapUrl);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Generating heatmap...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background map */}
      {mapImage && (
        <RNImage
          source={{ uri: mapUrl }}
          style={styles.mapImage}
          resizeMode="cover"
        />
      )}

      {/* Heatmap overlay */}
      {heatmapImage && (
        <Canvas style={styles.canvas}>
          <Image
            image={heatmapImage}
            x={0}
            y={0}
            width={width}
            height={height}
            fit="fill"
          />
        </Canvas>
      )}

      {points.length === 0 && (
        <View style={styles.noDataOverlay}>
          <Text style={styles.noDataText}>No measurement data</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    position: "relative",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ff0000",
    marginTop: 10,
    fontSize: 14,
  },
  mapImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  canvas: {
    position: "absolute",
    width: "100%",
    height: "100%",
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
  },
  noDataText: {
    color: "#ff0000",
    fontSize: 16,
    fontWeight: "bold",
  },
});
