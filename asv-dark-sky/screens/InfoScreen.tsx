import { StyleSheet, Text, View, ScrollView } from "react-native";

export default function InfoScreen() {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>ASV Dark Sky</Text>
        <Text style={styles.subtitle}>Sky Quality Meter</Text>

        <View style={styles.section}>
          <Text style={styles.heading}>About</Text>
          <Text style={styles.text}>
            This app measures sky brightness to assess light pollution levels. A
            higher Sky Quality Meter (SQM) reading indicates darker, less
            polluted skies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>How to Use</Text>
          <Text style={styles.text}>
            1. Take a photo of the sky (light frame){"\n"}
            2. Shield the camera lenses and take a dark frame{"\n"}
            3. Tap "Check Sky Quality" to calculate the SQM reading
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>SQM Scale</Text>
          <Text style={styles.text}>
            • 18-19: Urban sky{"\n"}• 19-20: Suburban sky{"\n"}• 20-21: Rural
            sky{"\n"}• 21-22: Dark rural sky{"\n"}• 22+: Excellent dark sky
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>🌙 Moon Brightness Impact</Text>
          <Text style={styles.text}>
            The moon significantly affects sky quality measurements. This app
            automatically adjusts for moon brightness to give you accurate
            readings.{"\n"}
            {"\n"}Check the <Text style={styles.bold}>Moon tab</Text> for
            current moon phase, position, and detailed information about moon
            impact on your measurements.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Data Storage</Text>
          <Text style={styles.text}>
            Every measurement automatically stores:{"\n"}• Raw SQM reading{"\n"}
            • Moon-adjusted SQM reading{"\n"}• Moon phase and illumination{"\n"}
            • GPS location and timestamp{"\n"}
            {"\n"}View full details by tapping any measurement in your history!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.heading}>Credits</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Developed by:</Text> Panko Digital{"\n"}
            <Text style={styles.bold}>Website:</Text> https://panko.digital
            {"\n"}
            {"\n"}Based in Geelong and proud members of the Astronomical Society
            of Victoria (ASV).
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: "#000000ff",
  },
  container: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginHorizontal: 10,
    paddingVertical: 40,
  },
  title: {
    color: "#ff0000ff",
    fontSize: 28,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 5,
    textAlign: "center",
  },
  subtitle: {
    color: "#ff0000ff",
    fontSize: 18,
    marginBottom: 30,
    textAlign: "center",
  },
  section: {
    width: "100%",
    marginBottom: 25,
  },
  heading: {
    color: "#ff0000ff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  text: {
    color: "#ff0000ff",
    fontSize: 16,
    lineHeight: 24,
  },
  subheading: {
    color: "#ff0000ff",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 5,
  },
  bold: {
    fontWeight: "700",
  },
  formula: {
    color: "#ff0000ff",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "Courier",
    backgroundColor: "#1a0000",
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ff0000",
    marginBottom: 8,
  },
  textSmall: {
    color: "#ff0000ff",
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.85,
  },
});
