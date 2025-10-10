import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  twinkleDuration: number;
  delay: number;
}

const StarfieldBackground: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);

  // Generate stars on mount
  useEffect(() => {
    const numberOfStars = 200;
    const newStars: Star[] = [];

    for (let i = 0; i < numberOfStars; i++) {
      newStars.push({
        id: i,
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * SCREEN_HEIGHT,
        size: Math.random() * 3 + 1.5, // 1.5 to 4.5
        opacity: new Animated.Value(Math.random() * 0.3 + 0.3), // Start between 0.3 and 0.6
        twinkleDuration: Math.random() * 2000 + 1500, // 1.5s to 3.5s
        delay: Math.random() * 3000, // 0 to 3s delay
      });
    }

    setStars(newStars);

    // Start twinkling animations
    newStars.forEach((star) => {
      const twinkle = () => {
        Animated.sequence([
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.3 + 0.4, // 0.4 to 0.7
            duration: star.twinkleDuration,
            useNativeDriver: true,
          }),
          Animated.timing(star.opacity, {
            toValue: Math.random() * 0.3 + 0.2, // 0.2 to 0.5
            duration: star.twinkleDuration,
            useNativeDriver: true,
          }),
        ]).start(() => twinkle());
      };

      // Start with delay
      setTimeout(() => twinkle(), star.delay);
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star) => (
        <Animated.View
          key={star.id}
          style={[
            styles.star,
            {
              left: star.x,
              top: star.y,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1a1a1a",
  },
  star: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 100,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default StarfieldBackground;
