import { StyleSheet, View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MoonPhase from "../components/MoonPhase";

export default function MoonScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Moon Information</Text>
          <Text style={styles.subtitle}>
            Current moon phase and sky brightness impact
          </Text>

          <MoonPhase />

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Understanding Moon Impact</Text>
            <Text style={styles.infoText}>
              The moon significantly affects sky brightness measurements. The
              component above shows the current moon phase, illumination
              percentage, and position in the sky.
            </Text>

            <Text style={styles.sectionTitle}>When to Measure</Text>
            <Text style={styles.infoText}>
              🌑 <Text style={styles.bold}>Best:</Text> New moon (0-10%
              illumination){"\n"}
              🌘 <Text style={styles.bold}>Good:</Text> Crescent moons or moon
              below horizon{"\n"}
              🌓 <Text style={styles.bold}>Acceptable:</Text> Quarter moons
              below 30° altitude{"\n"}
              🌕 <Text style={styles.bold}>Avoid:</Text> Full moon nights
            </Text>

            <Text style={styles.sectionTitle}>The Arc Visualization</Text>
            <Text style={styles.infoText}>
              When the moon is above the horizon, a curved arc shows its
              position in the sky. The arc represents the path from east (left)
              to zenith (center top) to west (right). The moon emoji indicates
              its current position.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    color: "#ff0000",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    color: "#ff0000",
    fontSize: 16,
    marginBottom: 30,
    textAlign: "center",
    opacity: 0.8,
  },
  infoSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#ff0000",
  },
  sectionTitle: {
    color: "#ff0000",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  infoText: {
    color: "#ff0000",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 10,
  },
  bold: {
    fontWeight: "700",
  },
});
