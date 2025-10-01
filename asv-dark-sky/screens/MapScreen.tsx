import { StyleSheet, Text, View } from "react-native";

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Map View</Text>
      <Text style={styles.subtext}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "#ff0000ff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtext: {
    color: "#ff0000ff",
    fontSize: 16,
  },
});
