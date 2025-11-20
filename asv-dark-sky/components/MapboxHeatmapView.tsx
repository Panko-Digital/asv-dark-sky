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
  radiusKm = 50, // Zoomed in closer to 50km
  smoothness = 50, // Reduced for smaller influence radius per point
  threshold = 0.02, // Slightly higher to contain the gradient
  opacity = 0.6, // 60% opacity for better map visibility
}: MapboxHeatmapViewProps) {
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const width = screenWidth;
  const height = screenHeight; // Full screen height

  const [mapUrl, setMapUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [heatmapImage, setHeatmapImage] = useState<SkImage | null>(null);

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

  // Color interpolation: green (good/low intensity) to amber to red (bad/high intensity)
  // Low intensity (0) = Green (SQM 22+) = Good dark sky
  // High intensity (1) = Red (SQM <20) = High light pollution
  const interpolateColor = (
    value: number
  ): { r: number; g: number; b: number; a: number } => {
    value = Math.max(0, Math.min(1, value));
    let r: number, g: number, b: number;

    if (value < 0.29) {
      // Green zone: SQM 22+ (good dark sky)
      const t = value / 0.29;
      r = Math.round(t * 255);
      g = 255;
      b = 0;
    } else if (value < 0.71) {
      // Amber/Yellow zone: SQM 20-22 (moderate)
      const t = (value - 0.29) / 0.42;
      r = 255;
      g = Math.round(255 - t * 100);
      b = 0;
    } else {
      // Red zone: SQM <20 (high light pollution)
      const t = (value - 0.71) / 0.29;
      r = 255;
      g = Math.round(155 * (1 - t));
      b = 0;
    }

    return { r, g, b, a: Math.round(opacity * 255) };
  };

  // Convert lat/lng to pixel coordinates for drawing
  const latLngToPixel = (lat: number, lng: number) => {
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLng = 111.32 * Math.cos((centerLat * Math.PI) / 180);
    const scale = Math.min(width, height) / (radiusKm * 2);
    
    const deltaLat = lat - centerLat;
    const deltaLng = lng - centerLng;
    
    const x = width / 2 + (deltaLng * kmPerDegreeLng * scale);
    const y = height / 2 - (deltaLat * kmPerDegreeLat * scale);
    
    return { x, y };
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Generating heatmap...</Text>
      </View>
    );
  }

  // Generate heatmap using metaball algorithm
  useEffect(() => {
    if (points.length === 0) {
      setHeatmapImage(null);
      return;
    }

    const canvas = Skia.Surface.Make(width, height);
    if (!canvas) return;

    const ctx = canvas.getCanvas();
    
    // Create pixel buffer - RGBA with alpha channel
    const imageData = new Uint8Array(width * height * 4);
    
    // Initialize ALL pixels to fully transparent (alpha = 0)
    for (let i = 0; i < imageData.length; i += 4) {
      imageData[i] = 0;     // R
      imageData[i + 1] = 0; // G
      imageData[i + 2] = 0; // B
      imageData[i + 3] = 0; // A - fully transparent
    }

    // Calculate metaball field values for each pixel with bilinear interpolation
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        let totalField = 0;
        let weightedR = 0;
        let weightedG = 0;
        let weightedB = 0;
        let totalWeight = 0;

        // Sum contributions from all points with smooth Gaussian falloff
        for (const point of points) {
          const { x, y } = latLngToPixel(point.latitude, point.longitude);
          const dx = px - x;
          const dy = py - y;
          const distSq = dx * dx + dy * dy;
          
          // Very wide Gaussian falloff for extremely smooth blending
          const radius = smoothness * 3.0; // Even larger influence radius
          const radiusSq = radius * radius;
          
          // Wider Gaussian spread (lower exponent = smoother)
          const influence = Math.exp(-2.0 * distSq / radiusSq);
          
          // Accumulate field strength
          totalField += influence;
          
          // Get color for this point's intensity
          const color = interpolateColor(point.intensity);
          
          // Accumulate weighted color values for smooth blending
          weightedR += color.r * influence;
          weightedG += color.g * influence;
          weightedB += color.b * influence;
          totalWeight += influence;
        }

        // Very soft threshold with extremely smooth transition
        let alpha = 0;
        if (totalField > threshold) {
          // Multiple smoothstep for ultra-smooth edges
          const normalized = Math.min(1, (totalField - threshold) / (threshold * 5.0));
          const smooth1 = normalized * normalized * (3 - 2 * normalized);
          alpha = smooth1 * smooth1 * (3 - 2 * smooth1); // Double smoothstep
        }

        // Edge feathering with very soft falloff
        const edgeDistance = 120;
        const distFromEdge = Math.min(px, py, width - px, height - py);
        if (distFromEdge < edgeDistance) {
          const edgeFade = Math.pow(distFromEdge / edgeDistance, 2.0);
          alpha *= edgeFade;
        }

        if (alpha > 0.005 && totalWeight > 0) {
          // Bilinear interpolation of colors
          const r = Math.round(weightedR / totalWeight);
          const g = Math.round(weightedG / totalWeight);
          const b = Math.round(weightedB / totalWeight);
          const finalAlpha = alpha * opacity;
          
          const idx = (py * width + px) * 4;
          // Premultiply RGB by alpha for proper blending
          imageData[idx] = Math.round(r * finalAlpha);
          imageData[idx + 1] = Math.round(g * finalAlpha);
          imageData[idx + 2] = Math.round(b * finalAlpha);
          imageData[idx + 3] = Math.round(finalAlpha * 255);
        }
        // If alpha <= 0.005, pixel remains fully transparent (already initialized to 0)
      }
    }

    // Create Skia image from buffer
    const data = Skia.Data.fromBytes(imageData);
    const skImage = Skia.Image.MakeImage(
      {
        width,
        height,
        alphaType: 1, // 1 = Premultiplied
        colorType: 4, // 4 = RGBA_8888 (the correct enum value)
      },
      data,
      width * 4
    );

    if (skImage) {
      setHeatmapImage(skImage);
    }

    canvas.dispose();
  }, [points, width, height, centerLat, centerLng, radiusKm, smoothness, threshold, opacity]);

  return (
    <View style={styles.container}>
      {/* Background map */}
      <RNImage
        source={{ uri: mapUrl }}
        style={styles.mapImage}
        resizeMode="cover"
      />

      {/* Heatmap overlay */}
      {heatmapImage && (
        <Canvas 
          style={styles.canvas}
          pointerEvents="none"
        >
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
    backgroundColor: "transparent",
    position: "relative",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
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
    backgroundColor: "transparent",
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
