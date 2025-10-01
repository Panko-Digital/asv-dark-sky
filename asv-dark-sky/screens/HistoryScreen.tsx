import { StyleSheet, Text, View } from "react-native";

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>History View</Text>
      <Text style={styles.subtext}>
        Your past sky quality measurements will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000ff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
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
    textAlign: "center",
  },
});
