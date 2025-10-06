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
            The moon significantly affects sky quality measurements by adding
            light to the sky. This app automatically calculates and adjusts for
            moon brightness to give you accurate readings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>How It Works</Text>
          <Text style={styles.text}>
            Two key factors determine moon impact:{"\n"}
            {"\n"}
            <Text style={styles.bold}>1. Moon Illumination (0-100%)</Text>
            {"\n"}How much of the moon's surface is lit. New moon = 0%, Full
            moon = 100%.{"\n"}
            {"\n"}
            <Text style={styles.bold}>2. Moon Altitude (0-90°)</Text>
            {"\n"}How high the moon is above the horizon. Horizon = 0°, Zenith
            (directly overhead) = 90°.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>The Formula</Text>
          <Text style={styles.formula}>
            Moon Impact = (Illumination/100) × sin(Altitude) × 1.5 mag{"\n"}
            {"\n"}Adjusted SQM = Raw SQM + Moon Impact
          </Text>
          <Text style={styles.textSmall}>
            A full moon at zenith can make the sky ~1.5 magnitudes brighter than
            a moonless night.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>Example Scenarios</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>New Moon:</Text> 0% illumination → No
            adjustment needed{"\n"}
            {"\n"}
            <Text style={styles.bold}>Full Moon at horizon:</Text> 100% ×
            sin(0°) × 1.5 = 0.00 mag impact{"\n"}
            {"\n"}
            <Text style={styles.bold}>Full Moon at 30° altitude:</Text> 100% ×
            sin(30°) × 1.5 = 0.75 mag impact{"\n"}
            {"\n"}
            <Text style={styles.bold}>Full Moon at zenith (90°):</Text> 100% ×
            sin(90°) × 1.5 = 1.50 mag impact{"\n"}
            {"\n"}
            <Text style={styles.bold}>Half Moon at 45° altitude:</Text> 50% ×
            sin(45°) × 1.5 = 0.53 mag impact
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>Why This Matters</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>• Research accuracy:</Text> Comparing
            measurements across different nights requires accounting for moon
            {"\n"}
            {"\n"}
            <Text style={styles.bold}>• True dark sky assessment:</Text>{" "}
            Moon-adjusted values show actual light pollution levels{"\n"}
            {"\n"}
            <Text style={styles.bold}>• Data analysis:</Text> Allows filtering
            or grouping measurements by moon conditions
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>Best Measurement Conditions</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>🌑 Best:</Text> New moon nights (0-10%
            illumination){"\n"}
            {"\n"}
            <Text style={styles.bold}>🌘 Good:</Text> Crescent moons or moon
            below horizon{"\n"}
            {"\n"}
            <Text style={styles.bold}>🌓 Acceptable:</Text> Quarter moons if
            below 30° altitude{"\n"}
            {"\n"}
            <Text style={styles.bold}>🌕 Avoid:</Text> Full moon nights (unless
            testing moon impact)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>Understanding Your Readings</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Raw SQM:</Text> Current sky conditions
            including moon brightness{"\n"}
            {"\n"}
            <Text style={styles.bold}>Moon-Adjusted SQM:</Text> What the reading
            would be without the moon (better for comparing different nights)
            {"\n"}
            {"\n"}
            <Text style={styles.bold}>Moon Impact:</Text> How many magnitudes
            the moon is adding to sky brightness
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>Scientific Limitations</Text>
          <Text style={styles.textSmall}>
            • Uses simplified moon altitude calculation{"\n"}• Doesn't account
            for atmospheric scattering{"\n"}• Doesn't consider moon's distance
            variation{"\n"}• Local terrain blocking moon not considered{"\n"}•
            Cloud cover effects not modeled{"\n"}
            {"\n"}Accuracy: ±0.2 magnitudes (sufficient for amateur astronomy
            and light pollution assessment)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.subheading}>Data Storage</Text>
          <Text style={styles.textSmall}>
            Every measurement automatically stores:{"\n"}• Raw SQM reading{"\n"}
            • Moon-adjusted SQM reading{"\n"}• Moon phase and illumination %
            {"\n"}• Moon altitude at time of measurement{"\n"}• Calculated moon
            impact in magnitudes{"\n"}
            {"\n"}View these details by tapping any measurement in your history!
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
